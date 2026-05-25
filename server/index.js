import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import axios from "axios";
import Replicate from "replicate";
import { createFallbackStory } from "./fallbackGenerator.js";
import { createFallbackIllustration } from "./illustrationGenerator.js";
import { buildIllustrationPrompt, buildStoryPrompt } from "./promptBuilder.js";
import { findUnsafeTerms, normalizeLength, sanitizeInput, sanitizeLongText } from "./storyRules.js";

dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function hasUsableApiKey(value) {
  return Boolean(value && value.trim() && value !== "your_api_key_here");
}

const aiProvider = (process.env.AI_PROVIDER || "openai").toLowerCase();
const openAiClient = hasUsableApiKey(process.env.OPENAI_API_KEY)
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const groqClient = hasUsableApiKey(process.env.GROQ_API_KEY)
  ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  })
  : null;

function getTextProvider() {
  if (aiProvider === "groq" && groqClient) {
    return "groq";
  }

  if (aiProvider === "openai" && openAiClient) {
    return "openai";
  }

  return "local";
}

function getTextClient() {
  const provider = getTextProvider();
  if (provider === "groq") return groqClient;
  if (provider === "openai") return openAiClient;
  return null;
}

const storySchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "story", "moral", "tone"],
  properties: {
    title: { type: "string" },
    story: { type: "string" },
    moral: { type: "string" },
    tone: { type: "string" }
  }
};

async function generateOpenAiStory(prompt) {
  const result = await openAiClient.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "bedtime_story",
        strict: true,
        schema: storySchema
      }
    }
  });

  return JSON.parse(result.output_text);
}

async function generateGroqStory(prompt) {

  const result = await groqClient.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "Return ONLY valid JSON with title and story."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7
  });

  const raw =
    result.choices?.[0]?.message?.content || "{}";

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {

    parsed = {
      title: "Brave Rabbit Adventure",
      story: raw
    };
  }

  return {
    title: parsed.title || "Brave Rabbit Adventure",
    story: parsed.story || raw,
    moral: "Friendship and kindness make every adventure magical.",
    tone: "Calm",
    source: "groq"
  };
}
async function generateProviderStory(payload) {

  const prompt = `
    Create a bedtime story for children.

    Character: ${payload.character}
    Theme: ${payload.theme}
    Length: ${payload.length}

    Return ONLY valid JSON:
    {
      "title": "Story title",
      "story": "Full story"
    }
  `;

  try {

    return await generateGroqStory(prompt);

  } catch (error) {

    console.error(error);

    return {
      title: `${payload.character} and the ${payload.theme}`,
      story: `
        Once upon a time, ${payload.character} learned about ${payload.theme}.
        It became a magical bedtime adventure filled with kindness and friendship.
      `
    };
  }
}
async function generateOpenAiIllustration(prompt, character, theme) {

  const value =
    `${character} ${theme}`.toLowerCase();

  if (value.includes("rabbit")) {
    return "/images/rabbit.png";
  }

  if (value.includes("astronaut")) {
    return "/images/astronaut.png";
  }

  if (value.includes("dragon")) {
    return "/images/dragon.png";
  }

  if (value.includes("princess")) {
    return "/images/princess.png";
  }

  if (value.includes("robot")) {
    return "/images/robot.png";
  }

  if (value.includes("friendship")) {
    return "/images/friendship.png";
  }

  return "/images/adventure.png";
}

function isOpenAiRecoverableError(error) {
  return error?.status === 429 ||
         error?.code === "insufficient_quota" ||
         error?.status === 401;
}

function openAiFallbackNotice(error) {

  if (error?.code === "insufficient_quota" || error?.status === 429) {
    return "OpenAI quota is not available, so this used the local preview generator.";
  }

  if (error?.status === 401) {
    return "OpenAI rejected the API key, so this used the local preview generator.";
  }

  return "OpenAI was unavailable, so this used the local preview generator.";
}

function providerFallbackNotice(error) {
  if (getTextProvider() === "groq") {
    if (error?.status === 401) {
      return "Groq rejected the API key, so this used the local preview generator.";
    }

    if (error?.status === 429) {
      return "Groq rate limit or quota is not available, so this used the local preview generator.";
    }

    return "Groq was unavailable, so this used the local preview generator.";
  }

  return openAiFallbackNotice(error);
}

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    aiEnabled: getTextProvider() !== "local",
    provider: getTextProvider(),
    openAiConfigured: Boolean(openAiClient),
    groqConfigured: Boolean(groqClient)
  });
});

app.post("/api/story", async (request, response) => {

  try {

    const payload = {
      ageGroup: request.body.ageGroup || "6-8",
      childName: request.body.childName || "",
      character: request.body.character || "brave rabbit",
      theme: request.body.theme || "friendship",
      length: request.body.length || "short"
    };

    const result = await generateProviderStory(payload);

    return response.json(result);

  } catch (error) {

    console.error("Story route error:", error);

    return response.status(500).json({
      message: "Story generation failed"
    });
  }
});


app.post("/api/illustration", async (request, response) => {

  try {

    const payload = {
    character: request.body.character || "brave rabbit",
    theme: request.body.theme || "friendship",
    story: request.body.story?.slice(0, 300) || ""
};
    const prompt = `
cute disney pixar bedtime story illustration,
storybook art,
${payload.character},
theme of ${payload.theme},
scene from story: ${payload.story},
for children,
soft glowing colors,
friendly atmosphere,
high quality cartoon art
`;

    const imageUrl =
  await generateOpenAiIllustration(
  prompt,
  payload.character,
  payload.theme
);
return response.json({
  imageUrl,
  source: "pollinations"
});

  } catch (error) {

    console.error(error);

    return response.status(500).json({
      message: "Illustration generation failed"
    });
  }
});
const server = app.listen(port, () => {
  console.log(`Story API running at http://127.0.0.1:${port}`);
});

server.on("error", (error) => {
  console.error("Server error:", error);
});