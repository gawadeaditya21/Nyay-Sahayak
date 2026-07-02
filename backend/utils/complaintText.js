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

export function normalizeComplaintInput(input) {
  if (!input) {
    return {};
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      return {};
    }

    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return normalizeComplaintInput(parsed);
        }
      } catch {
        // Fall through to treat as a plain incident description.
      }
    }

    return {
      incidentDescription: trimmed,
    };
  }

  if (typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return Object.entries(input).reduce((accumulator, [key, value]) => {
    if (value === null || value === undefined) {
      return accumulator;
    }

    if (Array.isArray(value)) {
      const normalizedValue = value.map((entry) => String(entry).trim()).filter(Boolean).join(", ");
      if (normalizedValue) {
        accumulator[key] = normalizedValue;
      }
      return accumulator;
    }

    if (typeof value === "object") {
      const normalizedValue = JSON.stringify(value);
      if (normalizedValue && normalizedValue !== "{}") {
        accumulator[key] = normalizedValue;
      }
      return accumulator;
    }

    const normalizedValue = String(value).trim();
    if (normalizedValue) {
      accumulator[key] = normalizedValue;
    }

    return accumulator;
  }, {});
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
