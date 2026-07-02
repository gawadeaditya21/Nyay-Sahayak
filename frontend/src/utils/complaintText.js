const COMPLAINT_JSON_PATTERN = /{[\s\S]*?}/g;

function dedupeSentences(text) {
  const sentences = String(text || "")
    .split(/(?<=[.!?।])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const seen = new Set();
  const uniqueSentences = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    uniqueSentences.push(sentence);
  }

  return uniqueSentences.join(" ");
}

export function sanitizeComplaintText(rawText) {
  if (!rawText) {
    return "";
  }

  let cleaned = String(rawText).replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(COMPLAINT_JSON_PATTERN, " ");
  cleaned = cleaned.replace(/\b(Structured|Normalized|payload)\b/gi, " ");
  cleaned = cleaned.replace(/[ \t]+$/gm, "");
  cleaned = cleaned.replace(/[ \t]{2,}/g, " ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = dedupeSentences(cleaned);
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned.trim();
}
