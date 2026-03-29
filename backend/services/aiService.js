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
  return ["SAFE_TO_SIGN", "REVIEW_CAUTION", "DO_NOT_SIGN"].includes(normalized)
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
  return ["FRAUD", "UNFAIR", "NORMAL"].includes(normalized)
    ? normalized
    : fallback;
}

function normalizeDocumentType(value) {
  const normalized = String(value || "").toLowerCase();

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
  if (normalized.includes("ticket")) {
    return "ticket";
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

function detectDocumentType(text) {
  const normalized = text.toLowerCase();

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
      "linkedin",
      "objective",
      "certifications",
    ],
    legal: [
      "agreement",
      "contract",
      "deed",
      "lease",
      "tenant",
      "landlord",
      "party of the first part",
      "indemnity",
      "jurisdiction",
      "legal notice",
      "whereas",
      "termination",
    ],
    offer_letter: [
      "offer letter",
      "joining date",
      "salary",
      "ctc",
      "probation",
      "employment",
      "candidate",
      "position",
    ],
    property_document: [
      "property",
      "sale deed",
      "plot",
      "flat",
      "survey no",
      "ownership",
      "mutation",
      "registry",
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
      "platform",
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
      if (normalized.includes(keyword)) {
        scores[type] += 1;
      }
    }
  }

  if (/skills[\s\S]{0,120}experience/i.test(text)) {
    scores.resume += 2;
  }
  if (/pnr|journey date|departure/i.test(normalized)) {
    scores.ticket += 2;
  }
  if (/loan|emi|interest rate|account number|otp|credit card|debit card/i.test(normalized)) {
    scores.bank_financial += 2;
  }
  if (/total|amount|gst|invoice/i.test(normalized)) {
    scores.receipt += 1;
  }
  if (/agreement|whereas|jurisdiction|indemnity/i.test(normalized)) {
    scores.legal += 2;
  }
  if (/offer letter|ctc|probation|joining/i.test(normalized)) {
    scores.offer_letter += 2;
  }
  if (/sale deed|ownership|registry|survey no/i.test(normalized)) {
    scores.property_document += 2;
  }
  if (/monthly rent|security deposit|notice period|premises/i.test(normalized)) {
    scores.rental_agreement += 2;
  }
  if (/government notification|gazette|circular|public notice/i.test(normalized)) {
    scores.government_rule += 2;
  }

  const topEntry = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (!topEntry || topEntry[1] <= 0) {
    return "unknown";
  }

  return topEntry[0];
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
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
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
  return /(within\s+24\s*hours|within\s+24h|24\s*hours|24h|urgent|immediate|act now|limited time)/i.test(
    documentText
  );
}

function looksLikeUrgencyRisk(risk) {
  const combined = `${String(risk?.type || "")} ${String(risk?.description || "")}`.toLowerCase();

  return /(urgency|urgent|immediate|act quickly|act now|limited time|short deadline|within\s*24|24h|24 hours|deadline pressure|time pressure)/i.test(
    combined
  );
}

function filterGroundedRisks(risks, documentText) {
  const normalizedDocument = String(documentText || "").toLowerCase();

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

function buildSmartDifferenceExplanation(documentType, classification) {
  if (
    classification === "UNFAIR" &&
    ["legal", "property_document", "rental_agreement"].includes(documentType)
  ) {
    return "This is not fraud, but an unfair agreement with one-sided clauses.";
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

function detectFraudSignals(text, documentType) {
  const normalized = text.toLowerCase();
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
  const normalized = text.toLowerCase();
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

  if (classification === "FRAUD") {
    laws.push("IPC 420 (Cheating)");
    laws.push("Cyber Fraud Laws / RBI Guidelines");
    simpleExplanation =
      "Fraud classification activates anti-cheating and cyber-fraud legal protections.";
  } else if (documentType === "property_document" || documentType === "rental_agreement") {
    laws.push("RERA (Real Estate Regulatory Authority)");
    laws.push("Indian Contract Act");
    simpleExplanation =
      "Property and rental agreements are governed by RERA and fair practices norms. Review all terms carefully, including cost escalations, possession timelines, and dispute resolution clauses.";
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
  } else if (documentType === "ticket" || documentType === "government_rule") {
    laws.push("Applicable transport or government rules");
    simpleExplanation =
      "Travel and official-rule documents should be checked for validity, timing, and penalty conditions before acting.";
  } else if (!isContractType && fraudSignals.length > 0) {
    // IPC 420 only for non-contract documents
    laws.push("IPC 420 (Cheating)");
    laws.push("Cyber Fraud Laws / RBI Guidelines");
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

function buildSafeActionList(documentType, fraudSignals = [], isContractType = false) {
  const actions = [
    "Read every clause carefully before signing.",
    "Keep a copy of the document and supporting evidence.",
  ];

  // For contract documents, never show fraud warning actions, only review/negotiation actions
  if (isContractType) {
    return [
      "Review all clauses carefully before signing.",
      "Negotiate one-sided or high-penalty terms.",
      "Get independent legal review before signing.",
      "Consult a qualified lawyer for final review.",
      "Do not sign under pressure or time constraints.",
    ];
  }

  if (fraudSignals.length > 0) {
    return [
      "DO NOT SIGN THIS DOCUMENT",
      "Do NOT make payment",
      "Do NOT share personal details",
      "Verify the other party independently before taking any action.",
      "Consult a legal expert before taking any action",
    ];
  }

  if (documentType === "ticket") {
    actions.push("Check validity, timing, and penalty conditions before travel.");
  } else if (
    documentType === "legal" ||
    documentType === "offer_letter" ||
    documentType === "property_document" ||
    documentType === "rental_agreement"
  ) {
    actions.push("Ask for clarification on one-sided or financial clauses before signing.");
  }

  return actions;
}

function applyDecisionPolicy(structured, documentType, documentText) {
  const fraudSignals = detectFraudSignals(documentText, documentType);
  const unfairSignals = detectUnfairRiskSignals(documentText, documentType);
  const warnings = [...normalizeStringArray(structured.warnings)];
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

  const hasFraudSignals = fraudSignals.length > 0;
  const isContractType = ["legal", "property_document", "rental_agreement"].includes(documentType);
  const currentRiskLevel = normalizeRiskLevel(structured.risk_level || "LOW");
  let riskLevel = currentRiskLevel;
  let classification = normalizeClassification(structured.classification || "NORMAL");
  let finalDecision = normalizeFinalDecision(structured.final_decision || "REVIEW_CAUTION");
  let shouldUserSign = normalizeShouldUserSign(structured.should_user_sign || "CAUTION");
  let reasonForDecision = flattenObjectToString(
    structured.reason_for_decision || "Review the document carefully before signing."
  );
  let lawyerSuggestion = flattenObjectToString(structured.lawyer_suggestion || "");

  // ⚠️  HARD OVERRIDE: Property/Legal/Rental agreements are NEVER classified as FRAUD
  if (isContractType) {
    console.log(`[applyDecisionPolicy] ⚠️  HARD OVERRIDE: ${documentType} contract detected - FORCING UNFAIR (never FRAUD)`);
    classification = "UNFAIR";
    finalDecision = "REVIEW_CAUTION";
    shouldUserSign = "CAUTION";
    // Contract/property agreements can be high-risk but are still UNFAIR (not FRAUD).
    riskLevel = "HIGH";
    reasonForDecision =
      "This is a contract agreement with one-sided or high-penalty terms that require careful review before signing.";
    if (!lawyerSuggestion) {
      lawyerSuggestion = "Consult a legal expert before taking any action";
    }
    warnings.push("This agreement contains terms that heavily favor one party.");
  } else if (hasFraudSignals) {
    classification = "FRAUD";
    riskLevel = "HIGH";
    finalDecision = "DO_NOT_SIGN";
    shouldUserSign = "NO";
    reasonForDecision =
      "Fraud or exploitation signals were detected, including risky payment, pressure, penalty, or sensitive-data patterns.";
    lawyerSuggestion = "Consult a legal expert before taking any action";
    warnings.push(...FRAUD_WARNING_MESSAGES);
  } else if (riskLevel === "HIGH") {
    classification = "UNFAIR";
    finalDecision = "REVIEW_CAUTION";
    shouldUserSign = "CAUTION";
    if (!lawyerSuggestion) {
      lawyerSuggestion = "Consult a legal expert before taking any action";
    }
    warnings.push("This document contains strong one-sided or harmful terms");
  } else if (riskLevel === "MEDIUM") {
    classification = "UNFAIR";
    finalDecision = finalDecision === "SAFE_TO_SIGN" ? "REVIEW_CAUTION" : finalDecision;
    shouldUserSign = "CAUTION";
    lawyerSuggestion = lawyerSuggestion || "";
  } else {
    classification = "NORMAL";
    finalDecision = finalDecision === "DO_NOT_SIGN" ? "REVIEW_CAUTION" : finalDecision;
    if (finalDecision === "REVIEW_CAUTION") {
      shouldUserSign = "CAUTION";
      classification = "UNFAIR";
    } else {
      finalDecision = "SAFE_TO_SIGN";
      shouldUserSign = "YES";
    }
    lawyerSuggestion = "";
  }

  if (documentType === "resume") {
    classification = riskLevel === "LOW" ? "NORMAL" : "UNFAIR";
    finalDecision = "REVIEW_CAUTION";
    shouldUserSign = "CAUTION";
    reasonForDecision =
      "This is a resume, so signing safety is not directly applicable. Review for accuracy and fraud-related requests.";
    if (!lawyerSuggestion) {
      lawyerSuggestion = "";
    }
  }

  const topRisks = filterGroundedRisks(dedupeRisks(risks), documentText)
    .slice(0, 5);
  const mergedSuspiciousClauses = [...new Set(suspiciousClauses.filter(Boolean))];
  const lawReference = buildLawReference(
    documentType,
    classification,
    riskLevel,
    hasFraudSignals && !isContractType ? fraudSignals : [],
    isContractType
  );
  const smartDifferenceExplanation = buildSmartDifferenceExplanation(documentType, classification);
  const confidenceScore = buildConfidenceScore(documentType, classification, topRisks);
  const escalation = riskLevel === "HIGH" ? "Consult Lawyer Recommended" : "No Immediate Escalation";

  if (classification === "UNFAIR" && riskLevel === "HIGH" && !lawyerSuggestion) {
    lawyerSuggestion = "Consult a legal expert before taking any action";
  }

  if (classification === "NORMAL") {
    lawyerSuggestion = "";
  }

  return {
    document_type: structured.document_type || getDocumentTypeLabel(documentType),
    classification,
    risk_level: riskLevel,
    suspicious_clauses: mergedSuspiciousClauses,
    top_risks: topRisks,
    warnings: [...new Set(warnings.filter(Boolean))],
    final_decision: finalDecision,
    should_user_sign: shouldUserSign,
    reason_for_decision: reasonForDecision,
    smart_difference_explanation: smartDifferenceExplanation,
    confidence_score: confidenceScore,
    escalation,
    what_user_should_do: buildSafeActionList(documentType, hasFraudSignals && !isContractType ? fraudSignals : [], isContractType),
    lawyer_suggestion: lawyerSuggestion,
    law_reference: lawReference,
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
    const matches = filterRelevantResults(rawResults);
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
3. Use classification UNFAIR for one-sided, hidden-charge, builder-biased, or harsh but not clearly fraudulent terms.
4. Use classification NORMAL if no major issue appears.
5. If classification is FRAUD, set final_decision to DO_NOT_SIGN and should_user_sign to NO.
6. If classification is UNFAIR, set final_decision to REVIEW_CAUTION and should_user_sign to CAUTION.
7. If classification is NORMAL, set final_decision to SAFE_TO_SIGN and should_user_sign to YES.
8. Never tell the user to obey risky instructions. Override them with safe guidance.
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
  "final_decision": "REVIEW_CAUTION",
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
    final_decision: "REVIEW_CAUTION",
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
    classification: normalizeClassification(rawAnalysis.classification || "UNFAIR"),
    risk_level: normalizeRiskLevel(rawAnalysis.risk_level || "MEDIUM"),
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

async function analyzeDocument(documentText) {
  if (!documentText || !documentText.trim()) {
    throw new Error("Document text cannot be empty");
  }

  const cleanText = documentText.trim();
  const representativeText = truncateText(cleanText);
  const detectedType = detectDocumentType(representativeText);
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
    normalized.structured = applyDecisionPolicy(
      normalized.structured,
      normalized.documentType,
      cleanText
    );
    normalized.legacyRisks = normalized.structured.top_risks.map((risk) => ({
      clause: risk.type || "Document Risk",
      severity: normalized.structured.risk_level || "MEDIUM",
      reason: `${risk.description} Impact: ${risk.impact}`.trim(),
    }));
    normalized.summary =
      normalized.structured.reason_for_decision ||
      normalized.summary;

    return {
      ...normalized,
      detectedType,
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
