import { getAgeRule } from "./storyRules.js";

function childLine(childName) {
  return childName ? `Personalize gently for a child named ${childName}.` : "Do not use a child name unless one is provided.";
}

export function buildStoryPrompt({ ageGroup, character, theme, length, childName }) {
  const rules = getAgeRule(ageGroup);
  const targetWords = length === "medium"
    ? Math.min(rules.maxWords, 650)
    : Math.min(rules.maxWords, 380);

  return `
You are a careful children's bedtime story writer.
Write a safe, calming bedtime story for a child aged ${rules.label}.
${childLine(childName)}

Requirements:
- Character: ${character}
- Theme: ${theme}
- Length: ${length}, about ${targetWords} words or fewer
- Language: ${rules.sentenceStyle}
- Plot: ${rules.plotStyle}
- Tone: soft, positive, cozy, and bedtime-friendly
- Include a catchy title, one complete short story, one positive moral lesson, and a tone label
- No chapters
- No scary, violent, unsafe, or inappropriate content
- End with a gentle goodnight feeling

Return only valid JSON with these fields:
{
  "title": "string",
  "story": "string",
  "moral": "string",
  "tone": "string"
}
`.trim();
}

export function buildContinuationPrompt({ ageGroup, character, theme, length, title, story, moral, childName }) {
  const rules = getAgeRule(ageGroup);
  const targetWords = length === "medium"
    ? Math.min(rules.maxWords, 600)
    : Math.min(rules.maxWords, 340);

  return `
You are a careful children's bedtime story writer.
Continue this bedtime story for a child aged ${rules.label}.
${childLine(childName)}

Original title: ${title}
Original story: ${story}
Original moral: ${moral}

Continuation requirements:
- Character: ${character}
- Theme: ${theme}
- Length: ${length}, about ${targetWords} words or fewer
- Language: ${rules.sentenceStyle}
- Plot: ${rules.plotStyle}
- Keep the same gentle world and character
- Add one new soft bedtime moment, not a chapter heading
- Keep the tone calm, positive, cozy, and bedtime-friendly
- Include a refreshed title, the continued story text, one positive moral lesson, and a tone label
- No scary, violent, unsafe, or inappropriate content
- End with a gentle goodnight feeling

Return only valid JSON with these fields:
{
  "title": "string",
  "story": "string",
  "moral": "string",
  "tone": "string"
}
`.trim();
}

export function buildIllustrationPrompt({ ageGroup, character, theme, title, story, childName }) {
  const rules = getAgeRule(ageGroup);

  return `
Create one warm children's bedtime storybook illustration.

Story title: ${title}
Main character: ${character}
Theme: ${theme}
Audience: children aged ${rules.label}
Child profile name: ${childName || "not provided"}
Story context: ${story}

Visual direction:
- Cozy picture-book style
- Soft moonlight, gentle colors, calm expressions
- Child-safe and bedtime-friendly
- No scary, violent, unsafe, or inappropriate imagery
- No text, captions, watermarks, or logos in the image
- Show one clear scene from the story
`.trim();
}
