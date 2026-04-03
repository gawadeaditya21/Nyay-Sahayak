import { ensureSupportedLanguage } from "../config/languages.js";
import { generateLegalChatResponse } from "../services/geminiChat.js";
import Message from "../models/Message.js";
import { encryptData, decryptData } from "../utils/cryptoUtils.js";

export async function chatWithLegalAssistant(req, res) {
  try {
    const { message, sessionId, language: rawLanguage } = req.body ?? {};
    const language = ensureSupportedLanguage(rawLanguage);
    console.log(
      `[chatController] language raw="${rawLanguage}" resolved="${language}"`
    );

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(503).json({
        success: false,
        reply:
          "Sorry, the legal assistant is temporarily unavailable. Please try again in a short while.",
        suggestions: ["See Steps"],
        contextUsed: false,
      });
    }
    if (req.user) {
      const userEncrypted = encryptData(JSON.stringify(message.trim()));
      await Message.create({
        userId: req.user._id,
        sessionId: sessionId || "default",
        role: "user",
        encryptedContent: userEncrypted,
      });
    }

    const result = await generateLegalChatResponse(message.trim(), { language });

    if (req.user) {
      const assistantEncrypted = encryptData(JSON.stringify(result));
      await Message.create({
        userId: req.user._id,
        sessionId: sessionId || "default",
        role: "assistant",
        encryptedContent: assistantEncrypted,
      });
    }
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

export async function getChatSessions(req, res) {
  try {
    const messages = await Message.find({ userId: req.user._id }).sort({ createdAt: 1 });
    const sessionsMap = new Map();
    
    for (const msg of messages) {
       const sid = msg.sessionId || "Legacy Chats";
       if (!sessionsMap.has(sid)) {
         let title = "Chat Session";
         if (msg.role === 'user') {
           try {
              const decryptedStr = decryptData(msg.encryptedContent);
              const txt = JSON.parse(decryptedStr);
              title = typeof txt === 'string' ? (txt.substring(0, 30) + (txt.length > 30 ? "..." : "")) : "Document Upload";
           } catch(e) {}
         } else if (sid === "Legacy Chats") {
           title = "Older Chats";
         }
         sessionsMap.set(sid, {
           sessionId: sid,
           title: title,
           createdAt: msg.createdAt
         });
       }
    }
    
    const sessions = Array.from(sessionsMap.values()).sort((a,b) => b.createdAt - a.createdAt);
    return res.status(200).json(sessions);
  } catch (error) {
    console.error("[chatController] Error fetching sessions:", error.message);
    return res.status(500).json({ error: "Failed to fetch sessions" });
  }
}

export async function getChatHistoryBySession(req, res) {
  try {
    const { sessionId } = req.params;
    
    const query = { userId: req.user._id };
    if (sessionId === "Legacy Chats") {
       query.$or = [{ sessionId: { $exists: false } }, { sessionId: null }, { sessionId: "default" }];
    } else {
       query.sessionId = sessionId;
    }
    
    const messages = await Message.find(query).sort({ createdAt: 1 });
    
    const decryptedMessages = messages.map(msg => {
      let content;
      try {
        const decryptedStr = decryptData(msg.encryptedContent);
        content = JSON.parse(decryptedStr);
      } catch (err) {
        console.error("Failed to decrypt or parse message:", err);
        content = "Error: Could not decrypt message";
      }

      if (msg.role === 'assistant') {
        return {
          role: "assistant",
          content: content.reply || content,
          suggestions: content.suggestions || [],
          contextUsed: content.contextUsed || false,
          createdAt: msg.createdAt
        };
      } else {
        return {
          role: "user",
          content: content,
          createdAt: msg.createdAt
        };
      }
    });

    return res.status(200).json(decryptedMessages);
  } catch (error) {
    console.error("[chatController] Error fetching chat history:", error.message);
    return res.status(500).json({ error: "Failed to fetch chat history" });
  }
}
