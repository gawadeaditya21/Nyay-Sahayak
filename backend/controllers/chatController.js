import { generateLegalChatResponse } from "../services/geminiChat.js";

export async function chatWithLegalAssistant(req, res) {
  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(503).json({
        success: false,
        reply:
          "Sorry, the legal assistant is temporarily unavailable. Please try again in a short while.",
        suggestions: ["See Steps"],
        contextUsed: false,
      });
    }
    const result = await generateLegalChatResponse(message.trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error("[chatController] Chat request failed:", error.message);

    return res.status(500).json({
      reply:
        "Sorry, the legal assistant is temporarily unavailable. Please try again in a short while.",
      suggestions: ["See Steps"],
      contextUsed: false,
    });
  }
}
