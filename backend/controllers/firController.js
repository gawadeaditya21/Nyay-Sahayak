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

function buildFirInputFromAnswers(answers) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return "";
  }

  const data = answers;

   return `
The complainant reports an incident of ${answers.incidentType || "unspecified offence"}.

The incident occurred on ${answers.incidentDate || "unknown date"} at ${answers.incidentTime || "unknown time"} 
at ${answers.incidentLocation || "unknown location"}.

Details of the incident:
${answers.incidentDescription || "Not Provided"}

Property involved:
${answers.propertyDetails || "Not Provided"}

Accused:
${
  answers.accusedKnown === "Yes"
    ? answers.accusedDetails
    : "Unknown"
}

Suspect description:
${answers.suspectDescription || "Not Available"}

Witnesses:
${answers.witnessDetails || "No known witnesses"}

Evidence:
${answers.evidenceDetails || "Not Provided"}

Additional information:
${answers.additionalInfo || "Not Provided"}

Complainant details:
${answers.victimDetails || "Not Provided"}
`.trim();
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

    // Only persist if user's plan allows data persistence
    const canPersist = req.planInfo?.limits?.dataPersistence ?? false;
    const shouldStore = identity.isAuthenticated && mode === "save" && canPersist;
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
