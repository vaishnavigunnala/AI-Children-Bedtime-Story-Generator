export const AGE_RULES = {
  "3-5": {
    label: "3 to 5",
    sentenceStyle: "very short sentences and very simple words",
    readTime: "2 to 3 minutes",
    plotStyle: "gentle events, repeated comforting phrases, and clear feelings",
    maxWords: 300
  },
  "6-8": {
    label: "6 to 8",
    sentenceStyle: "simple language with a little more detail",
    readTime: "3 to 5 minutes",
    plotStyle: "a small adventure with basic emotions and teamwork",
    maxWords: 500
  },
  "9-12": {
    label: "9 to 12",
    sentenceStyle: "clear language with richer description",
    readTime: "5 to 7 minutes",
    plotStyle: "a more detailed plot with light moral complexity",
    maxWords: 750
  }
};

const UNSAFE_TERMS = [
  "blood",
  "kill",
  "murder",
  "weapon",
  "gun",
  "knife",
  "horror",
  "nightmare",
  "ghost",
  "monster",
  "demon",
  "death"
];

export function getAgeRule(ageGroup) {
  return AGE_RULES[ageGroup] ?? AGE_RULES["6-8"];
}

export function findUnsafeTerms(values) {
  const text = Object.values(values).join(" ").toLowerCase();
  return UNSAFE_TERMS.filter((term) => text.includes(term));
}

export function sanitizeInput(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().replace(/\s+/g, " ").slice(0, 80) || fallback;
}

export function sanitizeLongText(value, fallback, maxLength = 4000) {
  if (typeof value !== "string") {
    return fallback;
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength) || fallback;
}

export function normalizeLength(length) {
  return length === "medium" ? "medium" : "short";
}
