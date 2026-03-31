import mammoth from "mammoth";
import { geminiModel, genAI } from "../config/gemini.js";
import {
  buildContextString,
  filterRelevantResults,
  runPythonSearch,
} from "./legalRag.js";

const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];
const RETRYABLE_STATUS_CODES = [429, 500, 503, 504];
const MAX_RETRY_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error) {
  const message = String(error?.message || "");
  const isRetryableStatus = RETRYABLE_STATUS_CODES.some((code) =>
    message.includes(`[${code}`)
  );

  return (
    isRetryableStatus ||
    /service unavailable|high demand|temporar|try again later|rate limit/i.test(message)
  );
}

function isModelUnavailableError(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("[404") ||
    message.includes("not found") ||
    message.includes("is not supported for generatecontent") ||
    message.includes("listmodels")
  );
}

function getModelInstance(modelName) {
  if (!genAI) {
    return geminiModel;
  }

  return genAI.getGenerativeModel({ model: modelName });
}

async function generateWithModelRetry(modelName, prompt) {
  const model = getModelInstance(modelName);
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;

      if (!isRetryableGeminiError(error) || attempt === MAX_RETRY_ATTEMPTS) {
        throw error;
      }

      const delayMs = 500 * 2 ** (attempt - 1);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function generateContentWithFallback(prompt) {
  let lastError = null;

  for (const modelName of [...new Set(FALLBACK_MODELS)]) {
    try {
      return await generateWithModelRetry(modelName, prompt);
    } catch (error) {
      lastError = error;

      if (isModelUnavailableError(error)) {
        console.warn(`[aiService] Model ${modelName} unavailable, trying next model...`);
        continue;
      }

      if (!isRetryableGeminiError(error)) {
        throw error;
      }

      console.warn(`[aiService] Model ${modelName} failed, trying fallback model...`);
    }
  }

  throw lastError || new Error("Gemini request failed across all fallback models");
}

const MAX_CHUNK_SIZE = 10000;
const MAX_ANALYSIS_INPUT = 18000;
const LEGAL_DATASET_ALLOWED_TYPES = new Set([
  "legal",
  "offer_letter",
  "property_document",
  "rental_agreement",
  "ticket",
  "bank_financial",
  "government_rule",
  "policy",
]);
const FRAUD_WARNING_MESSAGES = [
  "This document shows signs of fraud or exploitation",
  "Do NOT make any payment",
  "Do NOT share personal details",
];

function chunkText(text, chunkSize = MAX_CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

function removeMarkdownFormatting(text) {
  return text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

function parseJSONResponse(responseText) {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`No valid JSON found in Gemini response: ${error.message}`);
  }
}

function truncateText(text, maxLength = MAX_ANALYSIS_INPUT) {
  if (text.length <= maxLength) {
    return text;
  }

  const headSize = Math.floor(maxLength * 0.45);
  const tailSize = Math.floor(maxLength * 0.25);
  const middleSize = maxLength - headSize - tailSize;
  const middleStart = Math.max(0, Math.floor((text.length - middleSize) / 2));

  return [
    text.slice(0, headSize),
    "\n...\n",
    text.slice(middleStart, middleStart + middleSize),
    "\n...\n",
    text.slice(-tailSize),
  ].join("");
}

function cleanOcrText(text) {
  let cleaned = String(text || "").normalize("NFKC");
  cleaned = cleaned.replace(/[\u0000-\u001f]/g, " ");
  cleaned = cleaned.replace(/[“”]/g, '"').replace(/[’‘]/g, "'");
  cleaned = cleaned.replace(/[‐‑–—]/g, "-");
  cleaned = cleaned.replace(/[^A-Za-z0-9\s]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  const tokens = cleaned.split(" ").map((token) => {
    if (!token) {
      return "";
    }

    let fixed = token;
    const hasDigits = /\d/.test(fixed);
    const hasLetters = /[A-Za-z]/.test(fixed);

    if (hasDigits && hasLetters) {
      fixed = fixed.replace(/[oO]/g, "0").replace(/[lI]/g, "1");
    }

    fixed = fixed.replace(/rn/gi, "m").replace(/vv/gi, "w");

    return fixed;
  });

  return tokens.filter(Boolean).join(" ");
}

function normalizeForMatching(text) {
  return cleanOcrText(text).toLowerCase();
}

function inferLanguageInstruction(text) {
  const hasHindiScript = /[\u0900-\u097F]/.test(text);
  const hasHinglishMarkers =
    /\b(kya|kaise|batao|samjhao|karu|hai|rules|penalty|agreement)\b/i.test(text);

  return hasHindiScript || hasHinglishMarkers
    ? "Respond in simple Hinglish."
    : "Respond in simple English.";
}

function normalizeRiskLevel(value) {
  const normalized = String(value || "LOW").toUpperCase();
  return ["LOW", "MEDIUM", "HIGH"].includes(normalized) ? normalized : "LOW";
}

function normalizeFinalDecision(value, fallback = "REVIEW_CAUTION") {
  const normalized = String(value || fallback).toUpperCase();
  return [
    "SAFE_TO_SIGN",
    "SAFE_TO_USE",
    "SAFE_TO_REVIEW",
    "REVIEW_CAUTION",
    "DO_NOT_SIGN",
  ].includes(normalized)
    ? normalized
    : fallback;
}

function normalizeShouldUserSign(value, fallback = "CAUTION") {
  const normalized = String(value || fallback).toUpperCase();
  if (normalized.includes("YES")) {
    return "YES";
  }
  if (normalized.includes("NO")) {
    return "NO";
  }
  if (normalized.includes("CAUTION")) {
    return "CAUTION";
  }
  return fallback;
}

function normalizeClassification(value, fallback = "NORMAL") {
  const normalized = String(value || fallback).toUpperCase();
  return ["FRAUD", "UNFAIR", "ILLEGAL", "NORMAL"].includes(normalized)
    ? normalized
    : fallback;
}

function normalizeDocumentType(value) {
  const normalized = String(value || "").toLowerCase();

  // Transport docs must be recognized before agreement buckets.
  if (
    normalized.includes("ticket") ||
    normalized.includes("railway") ||
    normalized.includes("pnr") ||
    normalized.includes("journey") ||
    normalized.includes("train")
  ) {
    return "ticket";
  }

  if (normalized.includes("resume") || normalized.includes("cv")) {
    return "resume";
  }
  if (normalized.includes("offer")) {
    return "offer_letter";
  }
  if (normalized.includes("property")) {
    return "property_document";
  }
  if (normalized.includes("rental") || normalized.includes("lease")) {
    return "rental_agreement";
  }
  if (
    normalized.includes("bank") ||
    normalized.includes("financial") ||
    normalized.includes("loan") ||
    normalized.includes("account statement")
  ) {
    return "bank_financial";
  }
  if (normalized.includes("government") || normalized.includes("rule")) {
    return "government_rule";
  }
  if (normalized.includes("receipt") || normalized.includes("invoice") || normalized.includes("bill")) {
    return "receipt";
  }
  if (normalized.includes("policy")) {
    return "policy";
  }
  if (
    normalized.includes("legal") ||
    normalized.includes("agreement") ||
    normalized.includes("contract") ||
    normalized.includes("notice")
  ) {
    return "legal";
  }

  return "unknown";
}

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasKeyword(text, keyword) {
  const normalizedText = String(text || "").toLowerCase();
  const normalizedKeyword = String(keyword || "").toLowerCase().trim();

  if (!normalizedKeyword) {
    return false;
  }

  // Single short words are highly error-prone with OCR (e.g. "rent" in noisy text).
  if (!normalizedKeyword.includes(" ") && normalizedKeyword.length <= 5) {
    return new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, "i").test(normalizedText);
  }

  return normalizedText.includes(normalizedKeyword);
}

function detectDocumentType(text) {
  const normalized = normalizeForMatching(text);
  const compact = normalized.replace(/\s+/g, "");

  const scores = {
    resume: 0,
    legal: 0,
    offer_letter: 0,
    property_document: 0,
    rental_agreement: 0,
    ticket: 0,
    bank_financial: 0,
    government_rule: 0,
    receipt: 0,
    policy: 0,
  };

  const keywordGroups = {
    resume: [
      "resume",
      "curriculum vitae",
      "education",
      "skills",
      "experience",
      "projects",
      "professional summary",
      "linkedin",
      "objective",
      "profile",
      "certifications",
    ],
    legal: [
      "agreement",
      "contract",
      "deed",
      "memorandum",
      "lease",
      "tenant",
      "landlord",
      "party of the first part",
      "indemnity",
      "arbitration",
      "jurisdiction",
      "legal notice",
      "whereas",
      "termination",
    ],
    offer_letter: [
      "offer letter",
      "appointment letter",
      "joining date",
      "date of joining",
      "salary",
      "ctc",
      "probation",
      "employment",
      "candidate",
      "designation",
      "position",
      "benefits",
    ],
    property_document: [
      "property",
      "sale deed",
      "plot",
      "flat",
      "allotment",
      "possession",
      "survey no",
      "builder",
      "developer",
      "ownership",
      "mutation",
      "registry",
      "rera",
    ],
    rental_agreement: [
      "rent",
      "tenant",
      "landlord",
      "security deposit",
      "lease term",
      "notice period",
      "premises",
      "monthly rent",
      "rent agreement",
    ],
    ticket: [
      "ticket",
      "pnr",
      "journey",
      "boarding",
      "seat",
      "berth",
      "departure",
      "arrival",
      "railway",
      "train no",
      "train number",
      "platform",
      "irctc",
    ],
    bank_financial: [
      "bank",
      "loan",
      "interest rate",
      "emi",
      "account number",
      "ifsc",
      "credit card",
      "debit card",
      "otp",
      "net banking",
      "upi",
      "statement",
    ],
    government_rule: [
      "government",
      "gazette",
      "notification",
      "rule",
      "regulation",
      "circular",
      "compliance",
      "public notice",
    ],
    receipt: [
      "receipt",
      "invoice",
      "bill",
      "gst",
      "subtotal",
      "tax",
      "payment",
      "cashier",
      "amount paid",
    ],
    policy: [
      "policy",
      "terms and conditions",
      "refund policy",
      "privacy policy",
      "company policy",
      "employee handbook",
      "compliance",
    ],
  };

  for (const [type, keywords] of Object.entries(keywordGroups)) {
    for (const keyword of keywords) {
      if (hasKeyword(normalized, keyword)) {
        scores[type] += 1;
      }
    }
  }

  const strongSignalGroups = {
    ticket: [
      "railway",
      "pnr",
      "journey",
      "train",
      "coach",
      "berth",
      "platform",
      "boarding",
      "arrival",
      "departure",
      "atvm",
      "irctc",
      "reservation",
    ],
    rental_agreement: [
      "tenant",
      "landlord",
      "security deposit",
      "monthly rent",
      "rent agreement",
      "lease term",
      "notice period",
      "premises",
    ],
    property_document: [
      "property",
      "builder",
      "developer",
      "sale deed",
      "registry",
      "rera",
      "possession",
      "allotment",
    ],
    offer_letter: [
      "offer letter",
      "appointment letter",
      "ctc",
      "probation",
      "joining date",
      "date of joining",
      "designation",
    ],
    bank_financial: [
      "bank",
      "loan",
      "interest rate",
      "emi",
      "account number",
      "ifsc",
      "upi",
      "statement",
      "credit card",
      "debit card",
    ],
    resume: [
      "resume",
      "curriculum vitae",
      "education",
      "skills",
      "experience",
      "projects",
      "certifications",
      "linkedin",
    ],
  };

  const countSignals = (signals) =>
    signals.reduce((count, signal) => count + (hasKeyword(normalized, signal) ? 1 : 0), 0);

  const ticketSignalCount = countSignals(strongSignalGroups.ticket);
  const rentalSignalCount = countSignals(strongSignalGroups.rental_agreement);
  const propertySignalCount = countSignals(strongSignalGroups.property_document);
  const offerSignalCount = countSignals(strongSignalGroups.offer_letter);
  const bankSignalCount = countSignals(strongSignalGroups.bank_financial);
  const resumeSignalCount = countSignals(strongSignalGroups.resume);

  // Early override to protect common OCR-heavy transport tickets.
  if (ticketSignalCount >= 2 && rentalSignalCount === 0) {
    return "ticket";
  }

  if (isLikelyTicket(normalized)) {
    return "ticket";
  }

  if (propertySignalCount >= 3 && rentalSignalCount === 0) {
    return "property_document";
  }

  if (rentalSignalCount >= 3 && propertySignalCount === 0) {
    return "rental_agreement";
  }

  if (resumeSignalCount >= 3) {
    return "resume";
  }

  if (/skills[\s\S]{0,120}experience/i.test(normalized)) {
    scores.resume += 2;
  }
  if (/p\s*n\s*r/.test(normalized) || compact.includes("pnr")) {
    scores.ticket += 2;
  }
  if (/journey\s*date|train\s*(no|number)|boarding\s*station/i.test(normalized)) {
    scores.ticket += 2;
  }
  if (/irctc|reservation|coach|berth|platform/i.test(normalized)) {
    scores.ticket += 2;
  }
  if (/loan|emi|interest\s*rate|account\s*number|ifsc|upi|statement|otp|credit\s*card|debit\s*card/i.test(normalized)) {
    scores.bank_financial += 2;
  }
  if (/total|amount|gst|invoice/i.test(normalized)) {
    scores.receipt += 1;
  }
  if (/agreement|whereas|jurisdiction|indemnity|arbitration/i.test(normalized)) {
    scores.legal += 2;
  }
  if (/offer\s*letter|appointment\s*letter|ctc|probation|joining/i.test(normalized)) {
    scores.offer_letter += 2;
  }
  if (/sale\s*deed|ownership|registry|survey\s*no|rera|allotment|possession|builder|developer/i.test(normalized)) {
    scores.property_document += 2;
  }
  if (/monthly\s*rent|security\s*deposit|notice\s*period|premises|lease\s*term/i.test(normalized)) {
    scores.rental_agreement += 2;
  }
  if (/government notification|gazette|circular|public notice/i.test(normalized)) {
    scores.government_rule += 2;
  }

  const minSignalByType = {
    resume: 2,
    legal: 2,
    offer_letter: 2,
    property_document: 2,
    rental_agreement: 2,
    ticket: 2,
    bank_financial: 2,
    government_rule: 2,
    receipt: 2,
    policy: 2,
  };

  const qualifiedEntries = Object.entries(scores).filter(
    ([type, score]) => score >= (minSignalByType[type] || 1)
  );

  const topEntry = qualifiedEntries.sort((a, b) => b[1] - a[1])[0];
  if (!topEntry || topEntry[1] <= 0) {
    return isLikelyTicket(normalized) ? "ticket" : "unknown";
  }

  if (
    topEntry[0] !== "ticket" &&
    ticketSignalCount >= 2 &&
    scores.ticket >= Math.max(topEntry[1] - 1, 2)
  ) {
    return "ticket";
  }

  return topEntry[0];
}

function isLikelyTicket(text) {
  const normalized = normalizeForMatching(text);
  const compact = normalized.replace(/\s+/g, "");

  const patternSignals = [
    /pnr\s*[:#-]?\s*\d{8,12}/i,
    /train\s*(no|number)?\s*[:#-]?\s*\d{4,6}/i,
    /journey\s*date|boarding\s*station|from\s*station|to\s*station/i,
    /irctc|e\s*-?ticket|reservation|coach|berth|quota|class/i,
    /uts|unreserved|railway\s*ticket/i,
    /\d{2}[\/-]\d{2}[\/-]\d{2,4}/,
  ];

  const signalCount = patternSignals.reduce(
    (count, pattern) => (pattern.test(normalized) ? count + 1 : count),
    0
  );

  if (compact.includes("pnr") && /\d{8,12}/.test(compact)) {
    return true;
  }

  return signalCount >= 2;
}

function getDocumentTypeLabel(documentType) {
  const labels = {
    legal: "Legal Agreement",
    offer_letter: "Offer Letter",
    property_document: "Property Document",
    rental_agreement: "Rental Agreement",
    ticket: "Railway Ticket",
    bank_financial: "Bank / Financial Document",
    government_rule: "Government Rule",
    resume: "Resume",
    receipt: "Receipt / Bill",
    policy: "Policy Document",
    unknown: "Unknown",
  };

  return labels[documentType] || "Unknown";
}

function flattenObjectToString(value) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(flattenObjectToString).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => {
        const flattened = flattenObjectToString(nestedValue);
        return flattened ? `${key}: ${flattened}` : "";
      })
      .filter(Boolean)
      .join(", ");
  }

  return String(value);
}

function sanitizeJsonValue(value) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item == null) {
          return null;
        }

        if (typeof item === "object" && !Array.isArray(item)) {
          return flattenObjectToString(item);
        }

        return sanitizeJsonValue(item);
      })
      .filter((item) => item !== null && item !== "");
  }

  if (typeof value === "object") {
    const sanitizedObject = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      const sanitizedValue = sanitizeJsonValue(nestedValue);
      sanitizedObject[key] = sanitizedValue;
    }

    return sanitizedObject;
  }

  return String(value);
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => flattenObjectToString(item))
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildLegacyRisksFromList(items, severity, label) {
  return normalizeStringArray(items).map((item) => ({
    clause: label,
    severity,
    reason: item,
  }));
}

function dedupeRisks(risks) {
  const seen = new Set();

  return risks.filter((risk) => {
    const key = `${risk.type}|${risk.description}|${risk.impact}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function extractMeaningfulTokens(text) {
  return normalizeForMatching(text)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= 4 &&
        ![
          "this",
          "that",
          "with",
          "from",
          "will",
          "user",
          "document",
          "risk",
          "impact",
          "description",
          "buyer",
          "builder",
          "agreement",
          "clause",
          "terms",
          "their",
          "should",
          "before",
        ].includes(token)
    );
}

function isUrgencyGrounded(documentText) {
  return /(within\s+24\s*hours|within\s+24h|24\s*hours|24h|urgent|immediate|act\s+now|limited\s+time)/i.test(
    normalizeForMatching(documentText)
  );
}

function looksLikeUrgencyRisk(risk) {
  const combined = `${String(risk?.type || "")} ${String(risk?.description || "")}`.toLowerCase();

  return /(urgency|urgent|immediate|act quickly|act now|limited time|short deadline|within\s*24|24h|24 hours|deadline pressure|time pressure)/i.test(
    combined
  );
}

function filterGroundedRisks(risks, documentText) {
  const normalizedDocument = normalizeForMatching(documentText);

  return risks.filter((risk) => {
    if (looksLikeUrgencyRisk(risk)) {
      return isUrgencyGrounded(documentText);
    }

    const type = String(risk?.type || "").toLowerCase();
    const description = String(risk?.description || "").toLowerCase();

    const tokens = [
      ...extractMeaningfulTokens(type),
      ...extractMeaningfulTokens(description),
    ];

    if (tokens.length === 0) {
      return true;
    }

    const uniqueTokens = [...new Set(tokens)];
    const matchedCount = uniqueTokens.filter((token) => normalizedDocument.includes(token)).length;

    return matchedCount >= 1;
  });
}

function filterGroundedClauses(clauses, documentText) {
  const normalizedDocument = normalizeForMatching(documentText);

  return clauses.filter((clause) => {
    const tokens = extractMeaningfulTokens(clause);
    if (tokens.length === 0) {
      return true;
    }

    return tokens.some((token) => normalizedDocument.includes(token));
  });
}

function buildSmartDifferenceExplanation(documentType, classification) {
  if (
    classification === "UNFAIR" &&
    ["legal", "property_document", "rental_agreement"].includes(documentType)
  ) {
    return "This is not fraud, but an unfair agreement with one-sided clauses.";
  }

  if (classification === "ILLEGAL") {
    return "This document includes clauses that may be legally unenforceable under Indian law.";
  }

  if (classification === "FRAUD") {
    return "This appears to be fraud because multiple scam indicators are present together.";
  }

  return "No strong fraud or unfairness indicators were detected from the available text.";
}

function buildConfidenceScore(documentType, classification, topRisks) {
  const riskCount = Array.isArray(topRisks) ? topRisks.length : 0;

  if (["legal", "property_document", "rental_agreement"].includes(documentType)) {
    return classification === "UNFAIR" ? "92%" : "88%";
  }

  if (classification === "ILLEGAL") {
    return "94%";
  }

  if (classification === "FRAUD") {
    return riskCount >= 3 ? "90%" : "84%";
  }

  if (classification === "UNFAIR") {
    return "86%";
  }

  return "82%";
}

function normalizeSuspiciousClauses(value) {
  return normalizeStringArray(value).slice(0, 5);
}

function normalizeRiskEntries(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((risk) => {
      if (typeof risk === "string") {
        return {
          type: "General Risk",
          description: risk,
          impact: "User should review this point carefully before proceeding.",
        };
      }

      return {
        type: flattenObjectToString(risk?.type || "General Risk"),
        description: flattenObjectToString(risk?.description || ""),
        impact: flattenObjectToString(
          risk?.impact || "User should review this point carefully before proceeding."
        ),
      };
    })
    .filter((risk) => risk.description || risk.impact);
}

function detectIllegalSignals(text) {
  const normalized = normalizeForMatching(text);
  const signals = [];

  const illegalPatterns = [
    /no\s+legal\s+action/i,
    /cannot\s+(?:go|approach)\s+court/i,
    /no\s+right\s+to\s+sue/i,
    /waive\s+(?:your|the)?\s*right\s+to\s+sue/i,
    /no\s+court\s+remedy/i,
    /no\s+legal\s+recourse/i,
    /only\s+arbitration\s+and\s+no\s+court/i,
  ];

  if (illegalPatterns.some((pattern) => pattern.test(normalized))) {
    signals.push({
      type: "Illegal Restriction of Legal Rights",
      description: "The document appears to restrict the right to approach courts or seek legal remedies.",
      impact: "Such clauses can be void under Section 28 of the Indian Contract Act.",
      severity: "HIGH",
    });
  }

  return signals;
}

function detectQuantifiedImpacts(text) {
  const normalized = normalizeForMatching(text);
  const impacts = [];
  const percentRegex = /(\d{1,3}(?:\.\d+)?)\s*%\s*(increase|escalat|rise|hike|increment)/gi;
  const periodRegex = /(every|per)\s*(\d{1,2})?\s*(month|months|year|years|quarter|quarters)/i;

  let match;
  while ((match = percentRegex.exec(normalized)) !== null) {
    const rate = Number(match[1]);
    if (!Number.isFinite(rate) || rate <= 0) {
      continue;
    }

    const window = normalized.slice(Math.max(0, match.index - 40), match.index + 80);
    const periodMatch = window.match(periodRegex);
    let months = 12;

    if (periodMatch) {
      const count = Number(periodMatch[2] || 1);
      const unit = periodMatch[3];
      if (/quarter/.test(unit)) {
        months = 3 * count;
      } else if (/month/.test(unit)) {
        months = 1 * count;
      } else if (/year/.test(unit)) {
        months = 12 * count;
      }
    }

    if (months <= 0) {
      continue;
    }

    const periodsPerYear = 12 / months;
    const annualized = Math.pow(1 + rate / 100, periodsPerYear) - 1;
    const annualPercent = (annualized * 100).toFixed(1);
    const severity = annualized >= 1 ? "HIGH" : "MEDIUM";

    impacts.push({
      type: "Quantified Impact",
      description: `Detected ${rate}% increase every ${months} month(s).`,
      impact: `Estimated annualized increase is about ${annualPercent}%.`,
      severity,
    });
  }

  const dailyPenaltyRegex = /(penalt|late\s*fee|charge)[^\d]{0,20}(\d{2,6})\s*(?:per\s*day|daily)/i;
  const dailyMatch = normalized.match(dailyPenaltyRegex);
  if (dailyMatch) {
    const amount = Number(dailyMatch[2]);
    if (Number.isFinite(amount)) {
      const monthly = amount * 30;
      impacts.push({
        type: "Quantified Impact",
        description: `Daily penalty detected: ${amount} per day.`,
        impact: `Approx monthly impact is ${monthly}.`,
        severity: monthly >= 10000 ? "HIGH" : "MEDIUM",
      });
    }
  }

  return impacts.slice(0, 2);
}

function formatInrAmount(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  return `₹${formatter.format(Math.round(value))}`;
}

function extractQuantifiedImpactStrings(text) {
  const cleaned = cleanOcrText(text);
  const impacts = [];
  const percentMatches = [...cleaned.matchAll(/(\d{1,3}(?:\.\d+)?)\s*%/g)];
  const amountMatches = [...cleaned.matchAll(/(₹|rs\.?|inr)\s*([0-9][0-9,]{2,})/gi)];
  const keywordRegex = /(payment|deposit|fee|penalt|fine|charge|cancellation|forfeit|loss|deduct|refund)/i;

  for (const amountMatch of amountMatches) {
    const amount = Number(String(amountMatch[2]).replace(/,/g, ""));
    if (!Number.isFinite(amount)) {
      continue;
    }

    const windowStart = Math.max(0, amountMatch.index - 30);
    const windowEnd = Math.min(cleaned.length, amountMatch.index + 30);
    const window = cleaned.slice(windowStart, windowEnd);

    if (keywordRegex.test(window)) {
      impacts.push(`Potential financial impact of ${formatInrAmount(amount)}.`);
    }
  }

  for (const percentMatch of percentMatches) {
    const percent = Number(percentMatch[1]);
    if (!Number.isFinite(percent) || percent <= 0) {
      continue;
    }

    const nearest = amountMatches
      .map((match) => ({
        index: match.index,
        amount: Number(String(match[2]).replace(/,/g, "")),
      }))
      .filter((entry) => Number.isFinite(entry.amount))
      .sort((a, b) => Math.abs(a.index - percentMatch.index) - Math.abs(b.index - percentMatch.index))[0];

    if (nearest && Math.abs(nearest.index - percentMatch.index) <= 80) {
      const loss = (nearest.amount * percent) / 100;
      impacts.push(
        `${percent}% on ${formatInrAmount(nearest.amount)} equals approx ${formatInrAmount(loss)}.`
      );
    }
  }

  for (const impact of detectQuantifiedImpacts(text)) {
    if (impact.impact) {
      impacts.push(String(impact.impact));
    }
  }

  return [...new Set(impacts.filter(Boolean))].slice(0, 5);
}

function detectIllegalClauses(text) {
  const normalized = normalizeForMatching(text);
  const flags = [];

  const courtPatterns = [
    /no\s+legal\s+action/i,
    /cannot\s+(?:go|approach)\s+court/i,
    /no\s+right\s+to\s+sue/i,
    /waive\s+(?:your|the)?\s*right\s+to\s+sue/i,
    /no\s+court\s+remedy/i,
    /no\s+legal\s+recourse/i,
    /only\s+arbitration\s+and\s+no\s+court/i,
  ];

  if (courtPatterns.some((pattern) => pattern.test(normalized))) {
    flags.push({
      type: "ILLEGAL",
      clause: "Restriction on legal recourse detected.",
      law: "Section 28, Indian Contract Act",
      explanation: "Clauses that block access to courts are generally unenforceable.",
    });
  }

  if (/owner\s+can\s+enter\s+anytime|landlord\s+can\s+enter\s+anytime/i.test(normalized)) {
    flags.push({
      type: "ILLEGAL",
      clause: "Unrestricted entry without notice detected.",
      law: "Model Tenancy Act / State Rent Act",
      explanation: "Tenancy laws usually require reasonable notice before entry.",
    });
  }

  return flags;
}

function isSignableDocument(documentType) {
  return ["legal", "property_document", "rental_agreement", "offer_letter"].includes(documentType);
}

function resolveFinalDecision(documentType, classification, riskLevel) {
  if (classification === "FRAUD" || classification === "ILLEGAL") {
    return "DO_NOT_SIGN";
  }

  if (documentType === "ticket") {
    return "SAFE_TO_USE";
  }

  if (documentType === "resume") {
    return "SAFE_TO_REVIEW";
  }

  if (isSignableDocument(documentType)) {
    return classification === "UNFAIR" || riskLevel !== "LOW" ? "REVIEW_CAUTION" : "SAFE_TO_SIGN";
  }

  return "REVIEW_CAUTION";
}

function resolveShouldUserSign(finalDecision) {
  switch (finalDecision) {
    case "DO_NOT_SIGN":
      return "NO";
    case "SAFE_TO_SIGN":
    case "SAFE_TO_USE":
      return "YES";
    case "SAFE_TO_REVIEW":
      return "CAUTION";
    default:
      return "CAUTION";
  }
}

function buildGuidance(documentType, classification, riskLevel) {
  if (classification === "FRAUD") {
    return [
      "DO NOT SIGN THIS DOCUMENT",
      "Do NOT make payment.",
      "Do NOT share personal details.",
      "Verify the other party independently before any action.",
      "Consult a legal expert immediately.",
    ];
  }

  if (classification === "ILLEGAL") {
    return [
      "DO NOT SIGN THIS DOCUMENT",
      "Preserve a copy of the document and communications.",
      "Seek legal advice immediately to confirm enforceability.",
      "Do not accept terms that block access to courts.",
    ];
  }

  if (documentType === "ticket") {
    return [
      "Start the journey within the allowed window (often 1 hour for local tickets).",
      "Check ticket validity date/time; many tickets expire by midnight.",
      "Carry required ID proof and follow boarding rules.",
    ];
  }

  if (documentType === "resume") {
    return [
      "Verify personal and professional details for accuracy.",
      "Ensure claims are backed by evidence or examples.",
      "Improve formatting and clarity if needed.",
    ];
  }

  if (isSignableDocument(documentType)) {
    return [
      "Review clauses carefully before signing.",
      "Negotiate one-sided or high-penalty terms.",
      "Consult a legal expert if risk is high.",
    ];
  }

  return [
    "Verify key obligations, deadlines, and penalties before acting.",
    "Keep a copy of the document and related communications.",
  ];
}

function detectFraudSignals(text, documentType) {
  const normalized = normalizeForMatching(text);
  const signals = [];

  const signalRules = [
    {
      type: "Advance Payment Demand",
      description: "Payment or deposit is demanded before service, joining, or benefit is provided.",
      impact: "User may lose money before receiving any legitimate service or job security.",
      patterns: [
        /pay(?:ment)?\s+(?:before|prior)/i,
        /security deposit/i,
        /registration fee/i,
        /advance payment/i,
        /processing fee/i,
        /pay.*to join/i,
      ],
      onlyFor: ["offer_letter", "legal", "unknown"],
    },
    {
      type: "Urgency Pressure",
      description: "Document pressures the user to act quickly or within a very short deadline.",
      impact: "Urgency can be used to stop the user from reading terms properly and increases scam risk.",
      patterns: [/within\s+24\s+hours/i, /urgent/i, /immediately/i, /limited time/i],
      onlyFor: ["offer_letter", "bank_financial", "legal", "unknown"],
    },
    {
      type: "Sensitive Data Requested Early",
      description: "Sensitive identity or financial details are requested too early in the process.",
      impact: "User may face identity theft or fraud.",
      patterns: [/aadhaar/i, /pan card/i, /bank details/i, /otp/i, /cvv/i, /password/i],
      onlyFor: ["offer_letter", "bank_financial", "legal", "unknown"],
    },
    {
      type: "Possible Banking Phishing Pattern",
      description: "Document or message appears to ask for OTP, CVV, password, or full account details.",
      impact: "This can lead to direct account takeover or money loss.",
      patterns: [/otp/i, /cvv/i, /password/i, /share.*account details/i],
      onlyFor: ["bank_financial"],
    },
  ];

  for (const rule of signalRules) {
    const typeAllowed = !rule.onlyFor || rule.onlyFor.includes(documentType);
    if (typeAllowed && rule.patterns.some((pattern) => pattern.test(normalized))) {
      signals.push({
        type: rule.type,
        description: rule.description,
        impact: rule.impact,
      });
    }
  }

  return signals;
}

function detectUnfairRiskSignals(text, documentType) {
  const normalized = normalizeForMatching(text);
  const signals = [];

  const signalRules = [
    {
      type: "One-sided Penalty",
      description: "The document imposes heavy penalty or liability mainly on the user.",
      impact: "User may face unfair financial burden.",
      patterns: [/penalt(?:y|ies)/i, /liable to pay/i, /fine of/i],
      onlyFor: ["legal", "property_document", "rental_agreement", "offer_letter"],
      severity: "MEDIUM",
    },
    {
      type: "Builder Delay Risk",
      description: "The builder or seller appears protected against delays while buyer risk remains high.",
      impact: "User may face delay, extra cost, or reduced remedies.",
      patterns: [/delay/i, /possession/i, /builder/i, /developer/i],
      onlyFor: ["property_document"],
      severity: "MEDIUM",
    },
    {
      type: "One-sided Termination",
      description: "The other party can terminate or change terms with limited protection for the user.",
      impact: "User may lose rights, housing, or employment security suddenly.",
      patterns: [/terminate at any time/i, /sole discretion/i, /without notice/i],
      onlyFor: ["legal", "rental_agreement", "offer_letter", "policy"],
      severity: "MEDIUM",
    },
    {
      type: "Salary or Payment Uncertainty",
      description: "Payment, salary, or reimbursement terms are vague or discretionary.",
      impact: "User may commit time or money without guaranteed compensation.",
      patterns: [/salary.*subject to/i, /payment.*discretion/i, /amount to be decided/i],
      onlyFor: ["offer_letter", "legal", "bank_financial"],
      severity: "MEDIUM",
    },
    {
      type: "Strict Validity or Penalty Condition",
      description: "The ticket or transport document contains strict timing or penalty conditions.",
      impact: "User may lose travel rights or pay extra charges if they miss the rule.",
      patterns: [/valid/i, /boarding/i, /departure/i, /cancellation charge/i, /penalt(?:y|ies)/i],
      onlyFor: ["ticket"],
      severity: "LOW",
    },
  ];

  for (const rule of signalRules) {
    const typeAllowed = !rule.onlyFor || rule.onlyFor.includes(documentType);
    if (typeAllowed && rule.patterns.some((pattern) => pattern.test(normalized))) {
      signals.push({
        type: rule.type,
        description: rule.description,
        impact: rule.impact,
        severity: rule.severity,
      });
    }
  }

  return signals;
}

function buildLawReference(
  documentType,
  classification,
  riskLevel,
  fraudSignals = [],
  isContractType = false
) {
  const laws = [];
  let simpleExplanation = "";

  if (classification === "ILLEGAL") {
    laws.push("Indian Contract Act (Section 28)");
    simpleExplanation =
      "Clauses that restrict access to courts or legal remedies can be void under Section 28 of the Indian Contract Act.";
  } else if (classification === "FRAUD") {
    laws.push("IPC 420");
    laws.push("RBI / Cyber Fraud Guidelines");
    simpleExplanation =
      "Fraud classification activates anti-cheating and cyber-fraud legal protections.";
  } else if (documentType === "property_document" || documentType === "rental_agreement") {
    if (documentType === "property_document") {
      laws.push("RERA Act");
      laws.push("Indian Contract Act");
      simpleExplanation =
        "Property agreements are governed by RERA and contract law. Review cost escalations, possession timelines, and dispute resolution clauses carefully.";
    } else {
      laws.push("Model Tenancy Act / State Rent Act");
      laws.push("Indian Contract Act");
      simpleExplanation =
        "Rental agreements are governed by tenancy laws and contract law. Review rent escalation, notice periods, and penalty clauses carefully.";
    }
  } else if (documentType === "legal") {
    laws.push("Indian Contract Act");
    simpleExplanation =
      "General agreements are governed by contract law; review unfair or one-sided clauses before signing.";
  } else if (documentType === "offer_letter") {
    laws.push("Indian Contract Act");
    laws.push("Relevant Labour Laws");
    simpleExplanation =
      "Job offers should have clear and fair terms. Payment-before-joining demands can be a serious red flag.";
  } else if (documentType === "bank_financial") {
    laws.push("RBI Guidelines");
    simpleExplanation =
      "Banks and financial entities should not ask for OTP, CVV, or passwords for verification in normal processing.";
  } else if (documentType === "policy") {
    laws.push("Consumer Protection Act");
    simpleExplanation =
      "Policy and rules documents should use fair terms and should not hide unfair burdens on the user.";
  } else if (documentType === "ticket") {
    laws.push("Indian Railways Rules");
    simpleExplanation =
      "Tickets and travel documents should be checked for validity, timing, and penalty conditions before travel.";
  } else if (documentType === "government_rule") {
    laws.push("Applicable Government Rules");
    simpleExplanation =
      "Government rules or notices should be verified against official sources before acting.";
  } else if (!isContractType && fraudSignals.length > 0) {
    // IPC 420 only for non-contract documents
    laws.push("IPC 420");
    laws.push("RBI / Cyber Fraud Guidelines");
    simpleExplanation =
      "If the document appears deceptive or tries to obtain money or sensitive information unfairly, cheating-related laws may become relevant.";
  }

  if (riskLevel === "LOW" && laws.length === 0) {
    return {
      applicable: false,
      laws: [],
      simple_explanation: "",
    };
  }

  return {
    applicable: laws.length > 0,
    laws: [...new Set(laws)],
    simple_explanation: simpleExplanation,
  };
}

function applyDecisionPolicy(structured, documentType, documentText) {
  const inferredTicket = documentType !== "ticket" && isLikelyTicket(documentText);
  const policyDocumentType = inferredTicket ? "ticket" : documentType;
  const fraudSignals = detectFraudSignals(documentText, policyDocumentType);
  const unfairSignals = detectUnfairRiskSignals(documentText, policyDocumentType);
  const illegalSignals = detectIllegalSignals(documentText);
  const illegalFlags = detectIllegalClauses(documentText);
  const quantifiedImpacts = detectQuantifiedImpacts(documentText);
  const quantifiedImpactStrings = extractQuantifiedImpactStrings(documentText);
  let warnings = [...normalizeStringArray(structured.warnings)];
  const risks = normalizeRiskEntries(structured.top_risks || structured.risks);
  const suspiciousClauses = normalizeSuspiciousClauses(
    structured.suspicious_clauses || structured.hidden_conditions || structured.penalties
  );

  for (const signal of fraudSignals) {
    risks.push(signal);
  }
  for (const signal of unfairSignals) {
    risks.push(signal);
  }
  for (const signal of illegalSignals) {
    risks.push(signal);
  }
  for (const impact of quantifiedImpacts) {
    risks.push(impact);
  }

  const hasFraudSignals = fraudSignals.length > 0;
  const hasIllegalSignals = illegalSignals.length > 0;
  const isContractType = ["legal", "property_document", "rental_agreement"].includes(policyDocumentType);
  const isTicketType = policyDocumentType === "ticket";
  const currentRiskLevel = normalizeRiskLevel(structured.risk_level || "LOW");
  let riskLevel = currentRiskLevel;
  let classification = normalizeClassification(structured.classification || "NORMAL");
  let finalDecision = normalizeFinalDecision(structured.final_decision || "REVIEW_CAUTION");
  let shouldUserSign = normalizeShouldUserSign(structured.should_user_sign || "CAUTION");
  let reasonForDecision = flattenObjectToString(
    structured.reason_for_decision || "Review the document carefully before taking any action."
  );
  let lawyerSuggestion = flattenObjectToString(structured.lawyer_suggestion || "");

  if (hasIllegalSignals) {
    classification = "ILLEGAL";
    riskLevel = "HIGH";
    reasonForDecision =
      "This document appears to restrict legal rights or remedies, which can be legally unenforceable.";
    lawyerSuggestion = "Consult a legal expert before taking any action";
    warnings.push("Potentially illegal clause detected that limits legal remedies.");
  } else if (isTicketType && !hasFraudSignals) {
    // Ticket override: only treat as fraud if strong fraud signals exist.
    classification = "NORMAL";
    riskLevel = "LOW";
    reasonForDecision =
      "This appears to be a ticket or travel document with no strong fraud indicators. Follow validity rules before travel.";
    lawyerSuggestion = "";
    warnings = warnings.filter(
      (item) =>
        !/this document shows signs of fraud|do not make payment|do not share personal details/i.test(item)
    );
  } else if (isContractType) {
    // ⚠️  HARD OVERRIDE: Property/Legal/Rental agreements are NEVER classified as FRAUD
    console.log(`[applyDecisionPolicy] ⚠️  HARD OVERRIDE: ${documentType} contract detected - FORCING UNFAIR (never FRAUD)`);
    classification = "UNFAIR";
    // Contract/property agreements can be high-risk but are still UNFAIR (not FRAUD).
    riskLevel = currentRiskLevel === "LOW" ? "MEDIUM" : currentRiskLevel;
    reasonForDecision =
      "This is a contract agreement with one-sided or high-penalty terms that require careful review before signing.";
    if (!lawyerSuggestion) {
      lawyerSuggestion = "Consult a legal expert before taking any action";
    }
    warnings.push("This agreement contains terms that heavily favor one party.");
  } else if (hasFraudSignals) {
    classification = "FRAUD";
    riskLevel = "HIGH";
    reasonForDecision =
      "Fraud or exploitation signals were detected, including risky payment, pressure, penalty, or sensitive-data patterns.";
    lawyerSuggestion = "Consult a legal expert before taking any action";
    warnings.push(...FRAUD_WARNING_MESSAGES);
  } else if (riskLevel === "HIGH") {
    classification = "UNFAIR";
    if (!lawyerSuggestion) {
      lawyerSuggestion = "Consult a legal expert before taking any action";
    }
    warnings.push("This document contains strong one-sided or harmful terms");
  } else if (riskLevel === "MEDIUM") {
    classification = "UNFAIR";
    lawyerSuggestion = lawyerSuggestion || "";
  } else {
    classification = "NORMAL";
    lawyerSuggestion = "";
  }

  if (documentType === "resume") {
    classification = riskLevel === "LOW" ? "NORMAL" : "UNFAIR";
    reasonForDecision =
      "This is a resume, so signing safety is not directly applicable. Review for accuracy and fraud-related requests.";
    if (!lawyerSuggestion) {
      lawyerSuggestion = "";
    }
  }

  finalDecision = resolveFinalDecision(policyDocumentType, classification, riskLevel);
  shouldUserSign = resolveShouldUserSign(finalDecision);

  if (classification !== "FRAUD") {
    warnings = warnings.filter(
      (item) =>
        !/this document shows signs of fraud|do not make payment|do not share personal details/i.test(item)
    );
  }

  const topRisks = filterGroundedRisks(dedupeRisks(risks), documentText).slice(0, 5);
  const mergedSuspiciousClauses = filterGroundedClauses(
    [...new Set(suspiciousClauses.filter(Boolean))],
    documentText
  ).slice(0, 5);
  const lawReference = buildLawReference(
    policyDocumentType,
    classification,
    riskLevel,
    hasFraudSignals && !isContractType ? fraudSignals : [],
    isContractType
  );
  const smartDifferenceExplanation = buildSmartDifferenceExplanation(policyDocumentType, classification);
  const confidenceScore = buildConfidenceScore(policyDocumentType, classification, topRisks);
  const escalation = riskLevel === "HIGH" ? "Consult Lawyer Recommended" : "No Immediate Escalation";

  if (classification === "UNFAIR" && riskLevel === "HIGH" && !lawyerSuggestion) {
    lawyerSuggestion = "Consult a legal expert before taking any action";
  }

  if (classification === "NORMAL") {
    lawyerSuggestion = "";
  }

  const finalWarnings = [...new Set(warnings.filter(Boolean))].slice(0, 5);
  const legalValidityFlags = classification === "ILLEGAL" ? illegalFlags : [];

  const resolvedDocumentType =
    structured.document_type && String(structured.document_type).toLowerCase() !== "unknown"
      ? structured.document_type
      : getDocumentTypeLabel(policyDocumentType);

  return {
    document_type: resolvedDocumentType,
    classification,
    risk_level: riskLevel,
    suspicious_clauses: mergedSuspiciousClauses,
    top_risks: topRisks,
    warnings: finalWarnings,
    final_decision: finalDecision,
    should_user_sign: shouldUserSign,
    reason_for_decision: reasonForDecision,
    smart_difference_explanation: smartDifferenceExplanation,
    confidence_score: confidenceScore,
    escalation,
    what_user_should_do: buildGuidance(policyDocumentType, classification, riskLevel),
    lawyer_suggestion: lawyerSuggestion,
    law_reference: lawReference,
    quantified_impact: quantifiedImpactStrings,
    legal_validity_flags: legalValidityFlags,
    note_for_user:
      "This is AI guidance. For serious matters, consult a legal expert.",
  };
}

async function retrieveLegalContext(query, documentType) {
  if (!LEGAL_DATASET_ALLOWED_TYPES.has(documentType)) {
    return {
      context: "",
      contextUsed: false,
      contextCount: 0,
      matches: [],
    };
  }

  try {
    const rawResults = await runPythonSearch(query);
    const cleanedQuery = cleanOcrText(query);
    const matches = filterRelevantResults(rawResults, { queryText: cleanedQuery || query });
    const context = matches.length > 0 ? buildContextString(matches) : "";

    return {
      context,
      contextUsed: Boolean(context),
      contextCount: matches.length,
      matches,
    };
  } catch (error) {
    console.error("[aiService] Context retrieval failed:", error.message);
    return {
      context: "",
      contextUsed: false,
      contextCount: 0,
      matches: [],
    };
  }
}

async function generateStructuredJson(prompt) {
  const result = await generateContentWithFallback(prompt);
  const responseText = result.response.text();
  return parseJSONResponse(removeMarkdownFormatting(responseText));
}

function buildSharedGuardrails(languageInstruction) {
  return `
${languageInstruction}
Critical rules:
1. Return only valid JSON.
2. No markdown, no commentary, no extra text.
3. Never include unrelated context.
4. Use retrieved context only if it clearly matches the document or query.
5. If context mismatches, ignore it completely.
6. Do not hallucinate laws, penalties, or clauses.
7. Use only masked document text.
8. Detect realistic risks only. Do not force risks where none exist.
`.trim();
}

function buildLegalPrompt({ documentText, context, languageInstruction }) {
  return `
You are an expert legal assistant for Indian users.
${buildSharedGuardrails(languageInstruction)}

Analyze this as a legal or rules-based document.
Your primary job is to protect the user from fraud, financial loss, or unfair legal harm.

Retrieved context:
${context || "No relevant legal context available."}

Document text:
${documentText}

Return STRICT JSON:
{
  "document_type": "Legal Agreement",
  "classification": "FRAUD | UNFAIR | ILLEGAL | NORMAL",
  "risk_level": "LOW | MEDIUM | HIGH",
  "reason_for_decision": "",
  "suspicious_clauses": [],
  "top_risks": [
    {
      "type": "",
      "description": "",
      "impact": ""
    }
  ],
  "final_decision": "SAFE_TO_SIGN | REVIEW_CAUTION | DO_NOT_SIGN",
  "should_user_sign": "YES | NO | CAUTION",
  "what_user_should_do": [],
  "warnings": [],
  "law_reference": {
    "applicable": true,
    "laws": [],
    "simple_explanation": ""
  },
  "lawyer_suggestion": "",
  "note_for_user": "This is AI guidance. For serious matters, consult a legal expert."
}

Decision rules:
1. If there is payment before job/service, urgency pressure, high penalty, one-sided agreement, salary uncertainty, sensitive-data request, or fraud pattern, set risk_level to HIGH.
2. Use classification FRAUD only for scam-like or clearly deceptive patterns.
3. Use classification ILLEGAL if a clause blocks legal remedies or access to courts.
4. Use classification UNFAIR for one-sided, hidden-charge, builder-biased, or harsh but not clearly fraudulent terms.
5. Use classification NORMAL if no major issue appears.
6. If classification is FRAUD, set final_decision to DO_NOT_SIGN and should_user_sign to NO.
7. If classification is ILLEGAL, set final_decision to DO_NOT_SIGN and should_user_sign to NO.
8. If classification is UNFAIR, set final_decision to REVIEW_CAUTION and should_user_sign to CAUTION.
9. If classification is NORMAL, set final_decision to SAFE_TO_SIGN and should_user_sign to YES.
10. Never tell the user to obey risky instructions. Override them with safe guidance.
`.trim();
}

function buildResumePrompt({ documentText, languageInstruction }) {
  return `
You are an expert document assistant.
${buildSharedGuardrails(languageInstruction)}

Analyze this as a resume or CV.
Do not use legal dataset context for resume analysis.
Detect only realistic issues such as inconsistent dates, exaggerated claims, unclear achievements, or missing details.

Document text:
${documentText}

Return STRICT JSON:
{
  "document_type": "Resume",
  "classification": "FRAUD | UNFAIR | ILLEGAL | NORMAL",
  "risk_level": "LOW | MEDIUM | HIGH",
  "reason_for_decision": "",
  "suspicious_clauses": [],
  "top_risks": [
    {
      "type": "",
      "description": "",
      "impact": ""
    }
  ],
  "final_decision": "SAFE_TO_REVIEW",
  "should_user_sign": "CAUTION",
  "what_user_should_do": [],
  "warnings": [],
  "law_reference": {
    "applicable": false,
    "laws": [],
    "simple_explanation": ""
  },
  "lawyer_suggestion": "",
  "note_for_user": "This is AI guidance. For serious matters, consult a legal expert."
}
`.trim();
}

function buildTicketPrompt({ documentText, context, languageInstruction }) {
  return `
You are an expert assistant for tickets and travel-rule documents in India.
${buildSharedGuardrails(languageInstruction)}

Analyze this as a ticket, pass, or travel document.
Focus on validity, time limits, conditions, penalties, and practical mistakes the user must avoid.
Protect the user from fraud, fake tickets, and penalty traps.

Retrieved context:
${context || "No relevant legal context available."}

Document text:
${documentText}

Return STRICT JSON:
{
  "document_type": "Ticket",
  "classification": "FRAUD | UNFAIR | NORMAL",
  "risk_level": "LOW | MEDIUM | HIGH",
  "reason_for_decision": "",
  "suspicious_clauses": [],
  "top_risks": [
    {
      "type": "",
      "description": "",
      "impact": ""
    }
  ],
  "final_decision": "SAFE_TO_USE | REVIEW_CAUTION | DO_NOT_SIGN",
  "should_user_sign": "YES | NO | CAUTION",
  "what_user_should_do": [],
  "warnings": [],
  "law_reference": {
    "applicable": true,
    "laws": [],
    "simple_explanation": ""
  },
  "lawyer_suggestion": "",
  "note_for_user": "This is AI guidance. For serious matters, consult a legal expert."
}
`.trim();
}

function buildGenericPrompt({ documentText, documentType, languageInstruction }) {
  return `
You are an expert document assistant.
${buildSharedGuardrails(languageInstruction)}

Analyze this ${documentType} document for a common user.
Be practical and domain-aware.

Document text:
${documentText}

Return STRICT JSON:
{
  "document_type": "",
  "classification": "FRAUD | UNFAIR | ILLEGAL | NORMAL",
  "risk_level": "LOW | MEDIUM | HIGH",
  "reason_for_decision": "",
  "suspicious_clauses": [],
  "top_risks": [
    {
      "type": "",
      "description": "",
      "impact": ""
    }
  ],
  "final_decision": "SAFE_TO_SIGN | REVIEW_CAUTION | DO_NOT_SIGN",
  "should_user_sign": "YES | NO | CAUTION",
  "what_user_should_do": [],
  "warnings": [],
  "law_reference": {
    "applicable": false,
    "laws": [],
    "simple_explanation": ""
  },
  "lawyer_suggestion": "",
  "note_for_user": "This is AI guidance. For serious matters, consult a legal expert."
}
`.trim();
}

function buildQueryPrompt({ query, context, languageInstruction }) {
  return `
You are an expert legal assistant for Indian users.
${buildSharedGuardrails(languageInstruction)}

User query:
${query}

Retrieved context:
${context || "No relevant legal context available."}

Return STRICT JSON:
{
  "topic": "",
  "simple_explanation": "",
  "rules": [],
  "penalties": [],
  "user_guidance": []
}
`.trim();
}

function normalizeLegalAnalysis(rawAnalysis = {}) {
  const structured = {
    document_type: "Legal Agreement",
    classification: normalizeClassification(rawAnalysis.classification || "UNFAIR"),
    risk_level: normalizeRiskLevel(rawAnalysis.risk_level || "MEDIUM"),
    suspicious_clauses: normalizeStringArray(rawAnalysis.suspicious_clauses),
    top_risks: normalizeRiskEntries(rawAnalysis.top_risks),
    what_user_should_do: normalizeStringArray(rawAnalysis.what_user_should_do),
    warnings: normalizeStringArray(rawAnalysis.warnings),
    final_decision: normalizeFinalDecision(rawAnalysis.final_decision || "REVIEW_CAUTION"),
    should_user_sign: normalizeShouldUserSign(rawAnalysis.should_user_sign || "CAUTION"),
    reason_for_decision: flattenObjectToString(rawAnalysis.reason_for_decision || ""),
    law_reference: sanitizeJsonValue(rawAnalysis.law_reference || {}),
    lawyer_suggestion: flattenObjectToString(rawAnalysis.lawyer_suggestion || ""),
    note_for_user: flattenObjectToString(rawAnalysis.note_for_user || ""),
  };

  const legacyRisks = structured.top_risks.map((risk) => ({
    clause: risk.type || "Legal Risk",
    severity: structured.risk_level,
    reason: `${risk.description} Impact: ${risk.impact}`.trim(),
  }));

  return {
    documentType: "legal",
    summary: structured.reason_for_decision,
    structured,
    legacyRisks,
  };
}

function normalizeResumeAnalysis(rawAnalysis = {}) {
  const structured = {
    document_type: "Resume",
    classification: normalizeClassification(rawAnalysis.classification || "NORMAL"),
    risk_level: normalizeRiskLevel(rawAnalysis.risk_level || "MEDIUM"),
    reason_for_decision: flattenObjectToString(rawAnalysis.reason_for_decision || ""),
    suspicious_clauses: normalizeStringArray(rawAnalysis.suspicious_clauses),
    top_risks: normalizeRiskEntries(rawAnalysis.top_risks),
    final_decision: "SAFE_TO_REVIEW",
    should_user_sign: "CAUTION",
    what_user_should_do: normalizeStringArray(rawAnalysis.what_user_should_do),
    warnings: normalizeStringArray(rawAnalysis.warnings),
    law_reference: sanitizeJsonValue(rawAnalysis.law_reference || {}),
    lawyer_suggestion: flattenObjectToString(rawAnalysis.lawyer_suggestion || ""),
    note_for_user: flattenObjectToString(rawAnalysis.note_for_user || ""),
  };

  return {
    documentType: "resume",
    summary: structured.reason_for_decision,
    structured,
    legacyRisks: structured.top_risks.map((risk) => ({
      clause: risk.type || "Resume Issue",
      severity: structured.risk_level,
      reason: `${risk.description} Impact: ${risk.impact}`.trim(),
    })),
  };
}

function normalizeTicketAnalysis(rawAnalysis = {}) {
  const structured = {
    document_type: "Ticket",
    classification: normalizeClassification(rawAnalysis.classification || "NORMAL"),
    risk_level: normalizeRiskLevel(rawAnalysis.risk_level || "LOW"),
    reason_for_decision: flattenObjectToString(rawAnalysis.reason_for_decision || ""),
    suspicious_clauses: normalizeStringArray(rawAnalysis.suspicious_clauses),
    top_risks: normalizeRiskEntries(rawAnalysis.top_risks),
    what_user_should_do: normalizeStringArray(rawAnalysis.what_user_should_do || rawAnalysis.user_guidance),
    warnings: normalizeStringArray(rawAnalysis.warnings),
    final_decision: normalizeFinalDecision(rawAnalysis.final_decision || "REVIEW_CAUTION"),
    should_user_sign: normalizeShouldUserSign(rawAnalysis.should_user_sign || "CAUTION"),
    law_reference: sanitizeJsonValue(rawAnalysis.law_reference || {}),
    lawyer_suggestion: flattenObjectToString(rawAnalysis.lawyer_suggestion || ""),
    note_for_user: flattenObjectToString(rawAnalysis.note_for_user || ""),
  };

  const ticketRisks = [
    ...structured.top_risks.map((risk) => ({
      clause: risk.type || "Ticket Risk",
      severity: structured.risk_level,
      reason: `${risk.description} Impact: ${risk.impact}`.trim(),
    })),
    ...buildLegacyRisksFromList(structured.warnings, "MEDIUM", "Warning"),
  ];

  return {
    documentType: "ticket",
    summary: structured.reason_for_decision,
    structured,
    legacyRisks: ticketRisks,
  };
}

function normalizeGenericAnalysis(rawAnalysis = {}, detectedType) {
  const structured = {
    document_type: flattenObjectToString(
      rawAnalysis.document_type || getDocumentTypeLabel(detectedType)
    ),
    classification: normalizeClassification(rawAnalysis.classification || "NORMAL"),
    risk_level: normalizeRiskLevel(rawAnalysis.risk_level || "LOW"),
    reason_for_decision: flattenObjectToString(rawAnalysis.reason_for_decision || ""),
    suspicious_clauses: normalizeStringArray(rawAnalysis.suspicious_clauses),
    top_risks: normalizeRiskEntries(rawAnalysis.top_risks),
    what_user_should_do: normalizeStringArray(rawAnalysis.what_user_should_do || rawAnalysis.suggestions),
    warnings: normalizeStringArray(rawAnalysis.warnings),
    final_decision: normalizeFinalDecision(rawAnalysis.final_decision || "REVIEW_CAUTION"),
    should_user_sign: normalizeShouldUserSign(rawAnalysis.should_user_sign || "CAUTION"),
    law_reference: sanitizeJsonValue(rawAnalysis.law_reference || {}),
    lawyer_suggestion: flattenObjectToString(rawAnalysis.lawyer_suggestion || ""),
    note_for_user: flattenObjectToString(rawAnalysis.note_for_user || ""),
  };

  const legacyRisks = [
    ...structured.top_risks.map((risk) => ({
      clause: risk.type || "Document Risk",
      severity: structured.risk_level,
      reason: `${risk.description} Impact: ${risk.impact}`.trim(),
    })),
    ...buildLegacyRisksFromList(structured.warnings, "LOW", "Warning"),
  ];

  return {
    documentType: detectedType,
    summary: structured.reason_for_decision,
    structured,
    legacyRisks,
  };
}

async function analyzeDocument(documentText, options = {}) {
  if (!documentText || !documentText.trim()) {
    throw new Error("Document text cannot be empty");
  }

  const cleanText = documentText.trim();
  const rawText = String(options.rawText || "").trim();
  const detectionSource = String(options.detectionText || rawText || cleanText).trim();
  const representativeText = truncateText(cleanText);
  const detectionText = detectionSource ? truncateText(detectionSource) : representativeText;
  const detectedType = options.detectedTypeOverride || detectDocumentType(detectionText);
  const chunks = chunkText(cleanText);
  const languageInstruction = inferLanguageInstruction(cleanText);
  const rag = await retrieveLegalContext(representativeText.slice(0, 2000), detectedType);

  let prompt;
  let normalizer;

  if (detectedType === "resume") {
    prompt = buildResumePrompt({
      documentText: representativeText,
      languageInstruction,
    });
    normalizer = normalizeResumeAnalysis;
  } else if (detectedType === "ticket") {
    prompt = buildTicketPrompt({
      documentText: representativeText,
      context: rag.context,
      languageInstruction,
    });
    normalizer = normalizeTicketAnalysis;
  } else if (detectedType === "legal") {
    prompt = buildLegalPrompt({
      documentText: representativeText,
      context: rag.context,
      languageInstruction,
    });
    normalizer = normalizeLegalAnalysis;
  } else {
    prompt = buildGenericPrompt({
      documentText: representativeText,
      documentType: detectedType,
      languageInstruction,
    });
    normalizer = (rawAnalysis) => normalizeGenericAnalysis(rawAnalysis, detectedType);
  }

  try {
    const rawAnalysis = await generateStructuredJson(prompt);
    const normalized = normalizer(rawAnalysis);
    const policyText = rawText || cleanText;
    normalized.structured = applyDecisionPolicy(
      normalized.structured,
      normalized.documentType,
      policyText
    );
    const structuredType = normalizeDocumentType(normalized.structured.document_type);
    if (normalized.documentType === "unknown" && structuredType !== "unknown") {
      normalized.documentType = structuredType;
    }
    normalized.legacyRisks = normalized.structured.top_risks.map((risk) => ({
      clause: risk.type || "Document Risk",
      severity: normalized.structured.risk_level || "MEDIUM",
      reason: `${risk.description} Impact: ${risk.impact}`.trim(),
    }));
    normalized.summary =
      normalized.structured.reason_for_decision ||
      normalized.summary;

    const finalDetectedType =
      detectedType === "unknown" && normalized.documentType !== "unknown"
        ? normalized.documentType
        : detectedType;

    return {
      ...normalized,
      detectedType: finalDetectedType,
      contextUsed: rag.contextUsed,
      contextCount: rag.contextCount,
      chunksProcessed: chunks.length,
      totalRisksFound: normalized.legacyRisks.length,
    };
  } catch (error) {
    console.error("[aiService] Error in analyzeDocument:", error.message);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

function shouldUseLegalDatasetForQuery(queryText) {
  return /\b(rule|rules|legal|law|agreement|license|fir|penalty|property|ticket|traffic|notice)\b/i.test(
    queryText
  );
}

function normalizeQueryAnalysis(rawAnalysis = {}) {
  return {
    topic: flattenObjectToString(rawAnalysis.topic || "Legal Guidance"),
    simple_explanation: flattenObjectToString(
      rawAnalysis.simple_explanation || "Basic legal guidance is available."
    ),
    rules: normalizeStringArray(rawAnalysis.rules),
    penalties: normalizeStringArray(rawAnalysis.penalties),
    user_guidance: normalizeStringArray(rawAnalysis.user_guidance),
  };
}

async function analyzeLegalQuery(queryText) {
  if (!queryText || !queryText.trim()) {
    throw new Error("Query text cannot be empty");
  }

  const cleanedQuery = queryText.trim();
  const rag = shouldUseLegalDatasetForQuery(cleanedQuery)
    ? await retrieveLegalContext(cleanedQuery, "legal")
    : { context: "", contextUsed: false, contextCount: 0 };

  try {
    const rawAnalysis = await generateStructuredJson(
      buildQueryPrompt({
        query: cleanedQuery,
        context: rag.context,
        languageInstruction: inferLanguageInstruction(cleanedQuery),
      })
    );

    return {
      ...normalizeQueryAnalysis(rawAnalysis),
      contextUsed: rag.contextUsed,
      contextCount: rag.contextCount,
    };
  } catch (error) {
    console.error("[aiService] Error in analyzeLegalQuery:", error.message);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

async function extractTextFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  const extractedText = result.value.trim();

  if (!extractedText || extractedText.length < 20) {
    throw new Error("Unable to extract sufficient text from DOCX file.");
  }

  return {
    text: extractedText,
    method: "mammoth-docx",
    warnings: result.messages || [],
  };
}

export {
  analyzeDocument,
  analyzeLegalQuery,
  chunkText,
  detectDocumentType,
  extractTextFromDocx,
  parseJSONResponse,
  removeMarkdownFormatting,
};
