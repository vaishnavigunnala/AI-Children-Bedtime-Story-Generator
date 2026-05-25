function encodeSvg(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function normalizeLabel(value) {
  return String(value || "")
    .replace(/[<>&"]/g, "")
    .trim()
    .slice(0, 34);
}

export function createFallbackIllustration({ character, theme, title }) {
  const safeCharacter = normalizeLabel(character) || "Brave friend";
  const safeTheme = normalizeLabel(theme) || "Kindness";
  const safeTitle = normalizeLabel(title) || "Bedtime story";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="sky" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#172554"/>
      <stop offset="48%" stop-color="#31548f"/>
      <stop offset="100%" stop-color="#f7b267"/>
    </linearGradient>
    <linearGradient id="hill" x1="0" x2="1">
      <stop offset="0%" stop-color="#c7f9cc"/>
      <stop offset="100%" stop-color="#90dbf4"/>
    </linearGradient>
    <filter id="soft">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>
  <rect width="1200" height="800" fill="url(#sky)"/>
  <circle cx="930" cy="145" r="86" fill="#fff8c7"/>
  <circle cx="900" cy="122" r="86" fill="#31548f"/>
  <g fill="#ffffff" opacity="0.92">
    <circle cx="150" cy="130" r="6"/>
    <circle cx="300" cy="230" r="4"/>
    <circle cx="560" cy="115" r="5"/>
    <circle cx="760" cy="270" r="4"/>
    <circle cx="1030" cy="315" r="5"/>
  </g>
  <ellipse cx="600" cy="745" rx="720" ry="245" fill="url(#hill)"/>
  <ellipse cx="390" cy="610" rx="118" ry="132" fill="#fff7ed"/>
  <circle cx="390" cy="425" r="105" fill="#fff7ed"/>
  <circle cx="350" cy="407" r="12" fill="#1f2937"/>
  <circle cx="430" cy="407" r="12" fill="#1f2937"/>
  <path d="M355 462 Q390 492 425 462" fill="none" stroke="#1f2937" stroke-width="10" stroke-linecap="round"/>
  <path d="M315 328 Q280 210 340 150 Q384 240 372 327" fill="#fff7ed"/>
  <path d="M465 328 Q500 210 440 150 Q396 240 408 327" fill="#fff7ed"/>
  <path d="M505 570 Q650 485 760 555" fill="none" stroke="#fde68a" stroke-width="28" stroke-linecap="round"/>
  <circle cx="790" cy="565" r="44" fill="#fde68a" filter="url(#soft)"/>
  <circle cx="790" cy="565" r="28" fill="#fef3c7"/>
  <path d="M520 690 Q600 640 680 690" fill="none" stroke="#fff7ed" stroke-width="24" stroke-linecap="round" opacity="0.7"/>
  <circle cx="600" cy="626" r="18" fill="#fff8c7" opacity="0.95"/>
</svg>`.trim();

  return {
    imageUrl: encodeSvg(svg),
    prompt: `Cozy bedtime picture-book scene for ${safeCharacter} about ${safeTheme}.`,
    source: "local-fallback"
  };
}
