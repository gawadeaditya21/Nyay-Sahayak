import Analysis from "../models/Analysis.js";
import ChatSession from "../models/ChatSession.js";
import FIR from "../models/FIR.js";
import Message from "../models/Message.js";

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function toActivity(type, item) {
  const createdAt = item.createdAt || item.updatedAt || new Date();

  if (type === "chat") {
    return {
      type,
      title: item.title || "Legal chat",
      sessionId: item.sessionId,
      route: `/chat?session=${encodeURIComponent(item.sessionId)}`,
      createdAt,
    };
  }

  if (type === "analysis") {
    return {
      type,
      title: item.fileName || "Document analysis",
      sessionId: item.sessionId,
      route: `/analyze?session=${encodeURIComponent(item.sessionId)}`,
      createdAt,
    };
  }

  return {
    type,
    title: "FIR draft generated",
    sessionId: item.sessionId,
    route: `/fir?session=${encodeURIComponent(item.sessionId)}`,
    createdAt,
  };
}

async function getAnalysisSessions(userId) {
  const records = await Analysis.find({ userId }).sort({ createdAt: 1 }).lean();
  const sessions = new Map();

  for (const record of records) {
    const sessionId = record.sessionId || "Legacy Analyses";
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        sessionId,
        fileName: record.fileName || "Analysis Session",
        createdAt: record.createdAt,
        updatedAt: record.updatedAt || record.createdAt,
      });
    }
  }

  return Array.from(sessions.values());
}

async function getChatSessions(userId) {
  const sessions = await ChatSession.find({ userId })
    .sort({ updatedAt: -1 })
    .select({ sessionId: 1, title: 1, createdAt: 1, updatedAt: 1 })
    .lean();

  if (sessions.length > 0) {
    return sessions;
  }

  const messages = await Message.find({ userId }).sort({ createdAt: 1 }).lean();
  const sessionIds = new Map();

  for (const message of messages) {
    const sessionId = message.sessionId || "Legacy Chats";
    if (!sessionIds.has(sessionId)) {
      sessionIds.set(sessionId, {
        sessionId,
        title: sessionId === "Legacy Chats" ? "Older Chats" : "Chat Session",
        createdAt: message.createdAt,
        updatedAt: message.updatedAt || message.createdAt,
      });
    }
  }

  return Array.from(sessionIds.values());
}

export async function getDashboardSummary(req, res) {
  try {
    const userId = req.user._id;
    const weekStart = daysAgo(7);

    const [chatSessions, analysisSessions, firRecords, messageCount, analysisRecordCount] =
      await Promise.all([
        getChatSessions(userId),
        getAnalysisSessions(userId),
        FIR.find({ userId })
          .sort({ createdAt: -1 })
          .select({ sessionId: 1, createdAt: 1, updatedAt: 1 })
          .lean(),
        Message.countDocuments({ userId }),
        Analysis.countDocuments({ userId }),
      ]);

    const recentActivity = [
      ...chatSessions.map((item) => toActivity("chat", item)),
      ...analysisSessions.map((item) => toActivity("analysis", item)),
      ...firRecords.map((item) => toActivity("fir", item)),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 12);

    const weeklyActivity = {
      chats: chatSessions.filter((item) => new Date(item.createdAt) >= weekStart).length,
      analyses: analysisSessions.filter((item) => new Date(item.createdAt) >= weekStart).length,
      firs: firRecords.filter((item) => new Date(item.createdAt) >= weekStart).length,
    };

    const lastActivity = recentActivity[0]?.createdAt || null;

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          chats: chatSessions.length,
          analyses: analysisSessions.length,
          firs: firRecords.length,
          messages: messageCount,
          analysisRecords: analysisRecordCount,
          overall: chatSessions.length + analysisSessions.length + firRecords.length,
        },
        weeklyActivity,
        recentActivity,
        lastActivity,
      },
    });
  } catch (error) {
    console.error("[dashboardController] Failed to build dashboard:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard activity",
      error: "DASHBOARD_SUMMARY_FAILED",
    });
  }
}
