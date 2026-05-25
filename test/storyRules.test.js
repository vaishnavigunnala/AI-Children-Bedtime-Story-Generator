import assert from "node:assert/strict";
import test from "node:test";
import { buildContinuationPrompt, buildIllustrationPrompt, buildStoryPrompt } from "../server/promptBuilder.js";
import { findUnsafeTerms, getAgeRule, normalizeLength, sanitizeInput, sanitizeLongText } from "../server/storyRules.js";

test("returns age-specific story rules", () => {
  assert.equal(getAgeRule("3-5").label, "3 to 5");
  assert.equal(getAgeRule("unknown").label, "6 to 8");
});

test("sanitizes form values", () => {
  assert.equal(sanitizeInput("  brave    rabbit  ", "fallback"), "brave rabbit");
  assert.equal(sanitizeInput("", "fallback"), "fallback");
});

test("sanitizes long story text without applying form field limits", () => {
  const longStory = " gentle ".repeat(30);
  assert.equal(sanitizeLongText(longStory, "fallback").length > 80, true);
  assert.equal(sanitizeLongText("", "fallback"), "fallback");
});

test("normalizes story length", () => {
  assert.equal(normalizeLength("medium"), "medium");
  assert.equal(normalizeLength("long"), "short");
});

test("detects unsafe bedtime terms", () => {
  assert.deepEqual(findUnsafeTerms({ theme: "ghost story", character: "rabbit" }), ["ghost"]);
});

test("builds a prompt with child-safe requirements", () => {
  const prompt = buildStoryPrompt({
    ageGroup: "6-8",
    character: "brave rabbit",
    theme: "friendship",
    length: "short"
  });

  assert.match(prompt, /brave rabbit/);
  assert.match(prompt, /friendship/);
  assert.match(prompt, /No scary, violent/);
});

test("builds a personalized story prompt when a child name is provided", () => {
  const prompt = buildStoryPrompt({
    ageGroup: "6-8",
    childName: "Aarav",
    character: "brave rabbit",
    theme: "friendship",
    length: "short"
  });

  assert.match(prompt, /Aarav/);
  assert.match(prompt, /Personalize gently/);
});

test("builds a continuation prompt from an existing story", () => {
  const prompt = buildContinuationPrompt({
    ageGroup: "6-8",
    character: "brave rabbit",
    theme: "friendship",
    length: "short",
    childName: "Aarav",
    title: "Bunny and the Lost Star",
    story: "Bunny helped a star go home.",
    moral: "Helping friends matters."
  });

  assert.match(prompt, /Continue this bedtime story/);
  assert.match(prompt, /Aarav/);
  assert.match(prompt, /Bunny and the Lost Star/);
  assert.match(prompt, /Bunny helped a star go home/);
  assert.match(prompt, /No scary, violent/);
});

test("builds an illustration prompt with child-safe visual direction", () => {
  const prompt = buildIllustrationPrompt({
    ageGroup: "6-8",
    character: "brave rabbit",
    childName: "Aarav",
    theme: "friendship",
    title: "Bunny and the Lost Star",
    story: "Bunny helped a star go home."
  });

  assert.match(prompt, /storybook illustration/);
  assert.match(prompt, /Aarav/);
  assert.match(prompt, /brave rabbit/);
  assert.match(prompt, /No scary, violent/);
  assert.match(prompt, /No text, captions/);
});
