import { ensureSupportedLanguage } from "../config/languages.js";
import { generateFirDraft } from "../services/aiService.js";
import FIR from "../models/FIR.js";
import { decryptData, encryptData } from "../utils/cryptoUtils.js";
import { maskSensitiveData, unmaskData } from "../utils/dataMasking.js";
import { checkAndIncrementGuestUsage } from "../utils/guestLimits.js";
import { resolveMode, resolveRequestIdentity } from "../utils/requestIdentity.js";

const FIR_ANSWER_LABELS = {
  incidentType: "Incident type",
  incidentDate: "Incident date",
  incidentTime: "Incident time",
  incidentLocation: "Incident location",
  incidentDescription: "Incident description",
  propertyInvolved: "Property, item, or money involved",
  propertyDetails: "Property details",
  accusedKnown: "Accused known",
  accusedDetails: "Accused details",
  suspectDescription: "Suspect description",
  witnessAvailable: "Witnesses available",
  witnessDetails: "Witness details",
  evidenceAvailable: "Evidence available",
  evidenceDetails: "Evidence details",
  victimDetails: "Complainant details",
  fatherOrHusbandName: "Father's or husband's name",
  complainantAge: "Complainant age",
  complainantEmail: "Complainant email address",
  signatureName: "Name for signature section",
  additionalInfo: "Additional information",
};

const FIR_FIELD_ORDER = Object.keys(FIR_ANSWER_LABELS);

function sanitizeAnswer(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeAnswer).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value).trim();
}

function sentenceValue(value) {
  const cleaned = sanitizeAnswer(value);
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function buildFirInputFromAnswers(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return "";
  }

  const extraFields = Object.keys(answers).filter(
    (field) => !FIR_FIELD_ORDER.includes(field)
  );

  const lines = [...FIR_FIELD_ORDER, ...extraFields]
    .map((field) => {
      const value = sentenceValue(answers[field]);
      if (!value) return null;
      return `${FIR_ANSWER_LABELS[field] || field}: ${value}`;
    })
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  return [
    "Draft a formal, ready-to-submit FIR/complaint application from these structured facts.",
    "Do not repeat the questions or labels in the final draft. Convert the facts into a professional complaint letter with clear paragraphs.",
    "Use only facts provided by the user. If a required official detail is missing, use a blank placeholder.",
    "",
    "Structured facts:",
    ...lines,
  ].join("\n");
}

export async function generateFir(req, res) {
  try {
    const {
      user_input,
      fir_answers,
      language: rawLanguage,
      userId: rawUserId,
      mode: rawMode,
      sessionId,
    } = req.body ?? {};
    const language = ensureSupportedLanguage(rawLanguage);
    const mode = resolveMode(rawMode);
    console.log(
      `[firController] language raw="${rawLanguage}" resolved="${language}"`
    );

    const identity = resolveRequestIdentity(req, { userId: rawUserId });
    if (identity.error) {
      return res.status(identity.error.status).json({
        success: false,
        message: identity.error.message,
        error: identity.error.code,
      });
    }

    if (identity.isGuest) {
      const limitResult = checkAndIncrementGuestUsage(identity.userId, "fir");
      if (!limitResult.allowed) {
        return res.status(429).json({
          success: false,
          message: "Please login to continue",
          error: "LIMIT_EXCEEDED",
        });
      }
    }

    const structuredInput = buildFirInputFromAnswers(fir_answers);
    const plainInput = typeof user_input === "string" ? user_input.trim() : "";
    const inputForDraft = structuredInput || plainInput;

    if (!inputForDraft) {
      return res.status(400).json({
        success: false,
        message: "User input or FIR answers are required",
        error: "USER_INPUT_MISSING",
      });
    }

    const maskingResult = maskSensitiveData(inputForDraft);
    const generatedFirText = await generateFirDraft(maskingResult.maskedText, { language });
    const firText = maskingResult.hasSensitiveData
      ? unmaskData(generatedFirText, maskingResult.replacements)
      : generatedFirText;

    const shouldStore = identity.isAuthenticated && mode === "save";
    if (shouldStore) {
      const encrypted = encryptData(JSON.stringify(firText));
      await FIR.create({
        userId: identity.userId,
        sessionId: sessionId || "default",
        encryptedContent: encrypted,
      });
    }

    return res.status(200).json({
      success: true,
      fir_text: firText,
    });
  } catch (error) {
    console.error("[firController] FIR generation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate FIR at the moment",
      error: "FIR_GENERATION_FAILED",
      fir_text: "Please try again later.",
    });
  }
}

export async function getFirHistory(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 50);
    const records = await FIR.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const history = records.map((record) => {
      let content = "";
      try {
        const decryptedStr = decryptData(record.encryptedContent);
        const parsed = JSON.parse(decryptedStr);
        content = typeof parsed === "string" ? parsed : String(parsed || "");
      } catch (error) {
        content = "Error: Could not decrypt FIR";
      }

      return {
        sessionId: record.sessionId,
        content,
        createdAt: record.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("[firController] Error fetching FIR history:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch FIR history",
      error: "FIR_HISTORY_FAILED",
    });
  }
}
