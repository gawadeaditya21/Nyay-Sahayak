import { geminiModel } from "../config/gemini.js";
import { parseJSONResponse, removeMarkdownFormatting } from "./aiService.js";
import {
  buildContextString,
  filterRelevantResults,
  runPythonSearch,
} from "./legalRag.js";

function buildSuggestions(query) {
  const normalizedQuery = query.toLowerCase();
  const suggestions = ["See Steps"];

  if (normalizedQuery.includes("chori") || normalizedQuery.includes("theft")) {
    suggestions.unshift("Generate FIR");
  }

  if (normalizedQuery.includes("agreement")) {
    suggestions.push("Analyze Document");
  }

  return [...new Set(suggestions)];
}

function inferLanguageInstruction(text) {
  const hasHindiScript = /[\u0900-\u097F]/.test(text);
  const hasHinglishMarkers =
    /\b(kya|kaise|batao|samjhao|karu|hai|rules|penalty|agreement)\b/i.test(text);

  return hasHindiScript || hasHinglishMarkers
    ? "Respond in simple Hinglish."
    : "Respond in simple English.";
}

function normalizeDocumentType(value) {
  const raw = String(value || "").trim().toLowerCase();

  // Any agreement/contract document with ANY property/builder context → Property Agreement
  if (
    (raw.includes("property") || raw.includes("builder") || raw.includes("construction") || raw.includes("flat") || raw.includes("real estate") || raw.includes("real-estate")) &&
    (raw.includes("agreement") || raw.includes("contract") || raw.includes("legal"))
  ) {
    return "Property / Builder Agreement";
  }

  // General contract/agreement (but NOT property) → Legal Contract
  if (raw.includes("agreement") || raw.includes("contract")) {
    return "Legal Contract";
  }

  if (raw.includes("job") || raw.includes("offer") || raw.includes("employment")) {
    return "Job Offer Letter";
  }

  if (raw.includes("bank") || raw.includes("financial") || raw.includes("loan")) {
    return "Bank / Financial Document";
  }

  if (raw.includes("railway") || raw.includes("ticket")) {
    return "Railway Ticket";
  }

  if (raw.includes("resume") || raw.includes("cv")) {
    return "Resume";
  }

  if (raw.includes("policy") || raw.includes("rule")) {
    return "Policy / Rules";
  }

  return "Unknown";
}

function toUniqueArray(value, limit = 5) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))].slice(0, limit);
}

function normalizeLawReference(rawLaw = {}, documentType, classification) {
  const laws = toUniqueArray(rawLaw.laws, 5);
  const docType = String(documentType || "").toLowerCase();

  const hasLaw = (name) => laws.some((law) => law.toLowerCase().includes(name.toLowerCase()));
  const addLaw = (name) => {
    if (!hasLaw(name)) {
      laws.push(name);
    }
  };

  if (classification === "FRAUD") {
    addLaw("IPC 420");
    addLaw("RBI / Cyber Fraud Guidelines");
  } else {
    // Never include fraud laws for property/builder/contracts under non-fraud paths.
    for (let i = laws.length - 1; i >= 0; i -= 1) {
      if (laws[i].toLowerCase().includes("ipc 420")) {
        laws.splice(i, 1);
      }
    }

    if (docType.includes("property") || docType.includes("builder")) {
      addLaw("RERA Act");
    } else if (docType.includes("job offer")) {
      addLaw("Indian Contract Act");
    } else if (docType.includes("bank") || docType.includes("financial")) {
      addLaw("RBI Guidelines");
    }
  }

  let simpleExplanation = String(rawLaw.simple_explanation || "").trim();

  if (!simpleExplanation) {
    if (classification === "FRAUD") {
      simpleExplanation = "Fraud indicators show possible cheating risk, so anti-fraud legal protection is relevant.";
    } else if (docType.includes("property") || docType.includes("builder")) {
      simpleExplanation = "Property and builder matters are generally governed by RERA and contract terms; review terms carefully.";
    } else if (docType.includes("job offer")) {
      simpleExplanation = "Employment terms are usually enforced through contract law and must be reviewed before acceptance.";
    } else if (docType.includes("bank") || docType.includes("financial")) {
      simpleExplanation = "Banking and finance documents are generally governed by RBI compliance rules and fair practice norms.";
    } else {
      simpleExplanation = "Applicable law depends on document type and clause-level details.";
    }
  }

  return {
    applicable: Boolean(rawLaw.applicable ?? laws.length > 0),
    laws: toUniqueArray(laws, 5),
    simple_explanation: simpleExplanation,
  };
}

function hasAllFraudSignals(rawReply) {
  const sourceText = [
    rawReply.reason_for_decision,
    ...(Array.isArray(rawReply.suspicious_clauses) ? rawReply.suspicious_clauses : []),
    ...(Array.isArray(rawReply.top_risks) ? rawReply.top_risks : []),
    ...(Array.isArray(rawReply.warnings) ? rawReply.warnings : []),
  ]
    .join(" ")
    .toLowerCase();

  const paymentSignal = /(advance payment|pay first|payment before|processing fee|registration fee|deposit first|money first)/.test(
    sourceText
  );
  const urgencySignal = /(urgent|immediate|within 24|24h|act now|limited time)/.test(sourceText);
  const sensitiveSignal = /(otp|bank details|card details|cvv|upi pin|password)/.test(sourceText);
  const fakePromiseSignal = /(guaranteed|assured return|guaranteed job|too good to be true|fake promise)/.test(sourceText);

  // DEBUG: Log fraud signal detection
  console.log(`[hasAllFraudSignals] Payment: ${paymentSignal}, Urgency: ${urgencySignal}, Sensitive: ${sensitiveSignal}, FakePromise: ${fakePromiseSignal}`);
  const allSignalsPresent = paymentSignal && urgencySignal && sensitiveSignal && fakePromiseSignal;
  console.log(`[hasAllFraudSignals] Result: ${allSignalsPresent}`);

  return allSignalsPresent;
}

function normalizeQueryReply(rawReply = {}) {
  const documentType = normalizeDocumentType(rawReply.document_type);
  const isContractType =
    documentType === "Property / Builder Agreement" || documentType === "Legal Contract";

  let classification = String(rawReply.classification || "").trim().toUpperCase();
  if (!["FRAUD", "UNFAIR", "NORMAL"].includes(classification)) {
    classification = "NORMAL";
  }

  // DEBUG: Log the normalization process
  console.log(`[normalizeQueryReply] Raw document_type: "${rawReply.document_type}" → Normalized: "${documentType}"`);
  console.log(`[normalizeQueryReply] isContractType: ${isContractType}`);
  console.log(`[normalizeQueryReply] Classification before override: ${classification}`);

  // CRITICAL: HARD OVERRIDE FOR CONTRACTS (MUST RUN FIRST)
  if (isContractType) {
    console.log(`[normalizeQueryReply] ⚠️  HARD OVERRIDE: Contract document detected - FORCING UNFAIR classification`);
    classification = "UNFAIR";
  } else if (classification === "FRAUD" && !hasAllFraudSignals(rawReply)) {
    console.log(`[normalizeQueryReply] Signals check failed - converting FRAUD to UNFAIR`);
    classification = "UNFAIR";
  }

  console.log(`[normalizeQueryReply] Classification after override: ${classification}`);

  const riskLevelFromModel = String(rawReply.risk_level || "").trim().toUpperCase();
  const risk_level = ["LOW", "MEDIUM", "HIGH"].includes(riskLevelFromModel)
    ? riskLevelFromModel
    : classification === "FRAUD"
    ? "HIGH"
    : classification === "UNFAIR"
    ? "MEDIUM"
    : "LOW";

  const final_decision =
    classification === "FRAUD"
      ? "DO_NOT_SIGN"
      : classification === "UNFAIR"
      ? "REVIEW_CAUTION"
      : "SAFE_TO_SIGN";

  const should_user_sign =
    classification === "FRAUD" ? "NO" : classification === "UNFAIR" ? "CAUTION" : "YES";

  let warnings = toUniqueArray(rawReply.warnings, 5);
  let what_user_should_do = toUniqueArray(rawReply.what_user_should_do, 5);

  if (classification !== "FRAUD") {
    warnings = warnings.filter(
      (item) =>
        !/this appears to be a scam|do not make payment|do not share personal details/i.test(item)
    );
    what_user_should_do = what_user_should_do.filter(
      (item) => !/do not make payment|do not share personal details/i.test(item)
    );
  }

  if (classification === "UNFAIR" && what_user_should_do.length === 0) {
    what_user_should_do = [
      "Review all clauses carefully before signing.",
      "Negotiate one-sided or high-penalty terms.",
      "Consult a qualified lawyer for final review.",
    ];
  }

  if (classification === "FRAUD" && warnings.length === 0) {
    warnings = [
      "This appears to be a scam.",
      "Do NOT make payment.",
      "Do NOT share personal details.",
    ];
  }

  return {
    document_type: documentType,
    classification,
    final_decision,
    should_user_sign,
    risk_level,
    reason_for_decision: String(
      rawReply.reason_for_decision ||
        "Decision is based on detected clause risk, fairness, and scam indicators."
    ),
    suspicious_clauses: toUniqueArray(rawReply.suspicious_clauses, 5),
    top_risks: toUniqueArray(rawReply.top_risks, 5),
    what_user_should_do,
    warnings,
    law_reference: normalizeLawReference(rawReply.law_reference, documentType, classification),
    lawyer_suggestion: String(
      rawReply.lawyer_suggestion ||
        "If this matter can impact money, property, or legal rights, consult a legal expert."
    ),
    note_for_user:
      "This is AI guidance. For serious matters, consult a legal expert.",
  };
}

function buildChatPrompt({ query, context }) {
  const safeContext =
    context ||
    "No retrieved legal context available. Give safe general advice without hallucinating.";

  return `
You are Nyay Sahayak, an expert legal assistant for common people in India.
You must act like a practical legal advisor, not an academic summarizer.
${inferLanguageInstruction(query)}

Retrieved legal context:
${safeContext}

User query:
${query}

Rules:
1. Use the retrieved context only if it is clearly relevant.
2. Avoid hallucinating laws or penalties.
3. If unsure, clearly suggest consulting a legal expert.
4. Keep the guidance practical and useful for a normal person.
5. Ignore context completely if it does not match the user's issue.
6. Return only clean JSON.

Return this STRICT JSON only:
{
  "document_type": "Property / Builder Agreement | Legal Contract | Job Offer Letter | Bank / Financial Document | Railway Ticket | Resume | Policy / Rules | Unknown",
  "classification": "FRAUD | UNFAIR | NORMAL",
  "final_decision": "DO_NOT_SIGN | REVIEW_CAUTION | SAFE_TO_SIGN",
  "should_user_sign": "NO | CAUTION | YES",
  "risk_level": "LOW | MEDIUM | HIGH",
  "reason_for_decision": "",
  "suspicious_clauses": [],
  "top_risks": [],
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

Critical decision framework:
1. First detect document type correctly.
2. Hard override: if document_type is Property / Builder Agreement OR Legal Contract, never classify as FRAUD.
3. For those contract types, set classification=UNFAIR, final_decision=REVIEW_CAUTION, should_user_sign=CAUTION even if risk is HIGH.
4. Use FRAUD only if scam signals are all present: payment-before-service, urgency pressure, request for OTP/bank details, fake promises.
5. For one-sided clauses, hidden charges, high penalties, or builder-biased terms, classify as UNFAIR, not FRAUD.
6. Use law references carefully:
   - Property: RERA Act
   - Employment: Indian Contract Act
   - Fraud: IPC 420 and RBI/Cyber fraud guidelines
   - Banking: RBI Guidelines
   - Consumer issues: Consumer Protection Act
7. Max 5 items in risks/warnings arrays and avoid duplicates.
`.trim();
}

async function generateGeminiReply({ query, context }) {
  const prompt = buildChatPrompt({ query, context });
  const result = await geminiModel.generateContent(prompt);
  const responseText = result.response.text().trim();
  const parsed = parseJSONResponse(removeMarkdownFormatting(responseText));
  
  // DEBUG: Log what Gemini returned
  console.log(`[generateGeminiReply] Raw Gemini response document_type: "${parsed.document_type}"`);
  console.log(`[generateGeminiReply] Raw Gemini classification: "${parsed.classification}"`);
  
  const normalized = normalizeQueryReply(parsed);
  
  console.log(`[generateGeminiReply] After normalization - classification: "${normalized.classification}"`);
  
  return normalized;
}

function shouldUseLegalContext(query) {
  return /\b(rule|rules|legal|law|agreement|fir|property|ticket|traffic|police|theft|license|notice)\b/i.test(
    query
  );
}

export async function generateLegalChatResponse(query) {
  let context = "";
  let contextUsed = false;

  try {
    if (shouldUseLegalContext(query)) {
      const retrievedResults = await runPythonSearch(query);
      const relevantResults = filterRelevantResults(retrievedResults);
      context = buildContextString(relevantResults);
      contextUsed = Boolean(context);
    }
  } catch (error) {
    console.error("[geminiChat] Python RAG search failed:", error.message);
  }

  let reply;

  try {
    reply = await generateGeminiReply({ query, context });
  } catch (error) {
    console.error("[geminiChat] Gemini generation failed:", error.message);
    reply = {
      document_type: "Unknown",
      classification: "UNFAIR",
      final_decision: "REVIEW_CAUTION",
      should_user_sign: "CAUTION",
      risk_level: "MEDIUM",
      reason_for_decision:
        "Sorry, abhi structured legal response generate nahi ho paaya. Kripya thodi der baad try karein.",
      suspicious_clauses: [],
      top_risks: [],
      what_user_should_do: ["Important matter ho to legal expert se consult karein."],
      warnings: [],
      law_reference: {
        applicable: false,
        laws: [],
        simple_explanation: "Model response unavailable, so law mapping could not be confirmed.",
      },
      lawyer_suggestion: "For serious legal matters, consult a qualified lawyer.",
      note_for_user: "This is AI guidance. For serious matters, consult a legal expert.",
    };
  }

  return {
    reply,
    suggestions: buildSuggestions(query),
    contextUsed,
  };
}

export { buildChatPrompt, buildSuggestions };
