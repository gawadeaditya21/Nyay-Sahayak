import { generateLegalChatResponse } from "../services/geminiChat.js";

export async function chatWithLegalAssistant(req, res) {
  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        reply: "Message is required.",
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
        "Maaf kijiye, abhi legal assistant temporarily unavailable hai. Thodi der baad phir try kariye.",
      suggestions: ["See Steps"],
      contextUsed: false,
    });
  }
}
