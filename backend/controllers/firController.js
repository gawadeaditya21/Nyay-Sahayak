import { ensureSupportedLanguage } from "../config/languages.js";
import { generateComplaintLetter } from "../services/aiService.js";
import FIR from "../models/FIR.js";
import { decryptData, encryptData } from "../utils/cryptoUtils.js";
import { maskSensitiveData, unmaskData } from "../utils/dataMasking.js";
import { normalizeComplaintInput, sanitizeComplaintText } from "../utils/complaintText.js";
import { checkAndIncrementGuestUsage } from "../utils/guestLimits.js";
import { resolveMode, resolveRequestIdentity } from "../utils/requestIdentity.js";

const FIR_ANSWER_LABELS = {
  incidentType: "Incident Type",
  incidentDate: "Incident Date",
  incidentTime: "Incident Time",
  incidentLocation: "Incident Location",
  incidentDescription: "Incident Description",
  propertyInvolved: "Property, Item, or Money Involved",
  propertyDetails: "Property Details",
  accusedKnown: "Accused Known",
  accusedDetails: "Accused Details",
  suspectDescription: "Suspect Description",
  witnessAvailable: "Witnesses Available",
  witnessDetails: "Witness Details",
  evidenceAvailable: "Evidence Available",
  evidenceDetails: "Evidence Details",
  victimDetails: "Complainant Details",
  additionalInfo: "Additional Information",
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

function buildComplaintPayloadFromAnswers(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return {};
  }

  const normalizedAnswers = {};

  for (const field of FIR_FIELD_ORDER) {
    const value = sanitizeAnswer(answers[field]);
    if (value) {
      normalizedAnswers[field] = value;
    }
  }

  return normalizedAnswers;
}

export async function generateComplaintLetterController(req, res) {
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

    const structuredInput = buildComplaintPayloadFromAnswers(fir_answers);
    const plainInput = typeof user_input === "string" ? user_input.trim() : "";
    const complaintInput = Object.keys(structuredInput).length > 0
      ? structuredInput
      : normalizeComplaintInput(plainInput ? { incidentDescription: plainInput } : {});

    if (Object.keys(complaintInput).length === 0) {
      return res.status(400).json({
        success: false,
        message: "User input or complaint answers are required",
        error: "USER_INPUT_MISSING",
      });
    }

    const complaintPayloadJson = JSON.stringify(complaintInput);
    const maskingResult = maskSensitiveData(complaintPayloadJson);
    const generatedComplaintText = await generateComplaintLetter(maskingResult.maskedText, { language });
    const complaintText = sanitizeComplaintText(
      maskingResult.hasSensitiveData
        ? unmaskData(generatedComplaintText, maskingResult.replacements)
        : generatedComplaintText
    );

    // Only persist if user's plan allows data persistence
    const shouldStore = identity.isAuthenticated && mode === "save";
    if (shouldStore) {
      const encrypted = encryptData(JSON.stringify(complaintText));
      await FIR.create({
        userId: identity.userId,
        sessionId: sessionId || "default",
        encryptedContent: encrypted,
      });
    }

    return res.status(200).json({
      success: true,
      complaint_text: complaintText,
    });
  } catch (error) {
    console.error("[complaintController] Complaint generation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to generate complaint letter at the moment",
      error: "COMPLAINT_GENERATION_FAILED",
      complaint_text: "Please try again later.",
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
        content = "Error: Could not decrypt complaint letter";
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
    console.error("[firController] Error fetching complaint history:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint history",
      error: "COMPLAINT_HISTORY_FAILED",
    });
  }
}
