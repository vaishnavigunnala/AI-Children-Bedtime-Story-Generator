import { getAgeRule } from "./storyRules.js";

const cozyPlaces = ["moonlit meadow", "quiet garden", "soft blue hill", "sleepy little village"];
const helpers = ["a kind firefly", "a gentle owl", "a tiny cloud", "a warm lantern"];

function pick(items, seed) {
  const index = Math.abs(seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % items.length;
  return items[index];
}

function childIntro(childName) {
  return childName ? ` for ${childName}` : "";
}

export function createFallbackStory({ ageGroup, character, theme, length, childName }) {
  const rule = getAgeRule(ageGroup);
  const place = pick(cozyPlaces, character);
  const helper = pick(helpers, theme);
  const extraMoment = length === "medium"
    ? ` On the path, ${character} listened carefully, shared a small smile, and learned that even quiet choices can make the night brighter.`
    : "";

  return {
    title: `${character} and the Gentle ${theme}`,
    story: `Once upon a time${childIntro(childName)}, ${character} lived near a ${place}. One calm evening, the stars began to sparkle, and ${character} wondered how to practice ${theme} before bedtime. Soon, ${helper} appeared with a soft glow and asked for help finding the way home.${extraMoment} ${character} took a deep breath, chose kindness, and walked slowly beside the new friend. Together, they followed the silver moonlight until everything felt peaceful again. The helper thanked ${character}, and the whole sky seemed to twinkle with pride. ${character} curled up under a cozy blanket, feeling happy, safe, and ready for sweet dreams. Goodnight.`,
    moral: `Small acts of ${theme.toLowerCase()} can make others feel safe and loved.`,
    tone: `Calm and age-appropriate for ages ${rule.label}`,
    source: "local-fallback"
  };
}

export function createFallbackContinuation({ ageGroup, character, theme, length, title, story, childName }) {
  const rule = getAgeRule(ageGroup);
  const helper = pick(helpers, `${title}${theme}`);
  const extraMoment = length === "medium"
    ? ` ${character} remembered the first adventure and felt brave in a quiet, peaceful way.`
    : "";

  return {
    title: `${title}: A Softer Tomorrow`,
    story: `${story}\n\nThe next evening${childIntro(childName)}, ${character} noticed ${helper} waiting near the window with a tiny sparkle. There was one more kind thing to do before sleep: share ${theme.toLowerCase()} with someone who felt unsure.${extraMoment} ${character} spoke gently, listened with care, and made the night feel friendly again. Soon the moon rose high, the room grew still, and every little worry seemed to rest. ${character} smiled, pulled the blanket close, and drifted toward sweet dreams. Goodnight.`,
    moral: `A kind heart can keep growing, even after one good deed is done.`,
    tone: `Calm continuation for ages ${rule.label}`,
    source: "local-fallback"
  };
}
