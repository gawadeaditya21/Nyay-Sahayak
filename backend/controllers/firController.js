import { ensureSupportedLanguage } from "../config/languages.js";
import { generateFirDraft } from "../services/aiService.js";

export async function generateFir(req, res) {
  try {
    const { user_input, language: rawLanguage } = req.body ?? {};
    const language = ensureSupportedLanguage(rawLanguage);
    console.log(
      `[firController] language raw="${rawLanguage}" resolved="${language}"`
    );

    if (!user_input || typeof user_input !== "string" || !user_input.trim()) {
      return res.status(400).json({
        success: false,
        message: "User input is required",
        error: "USER_INPUT_MISSING",
      });
    }

    const firText = await generateFirDraft(user_input.trim(), { language });

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
