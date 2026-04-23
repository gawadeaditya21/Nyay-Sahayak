import Usage from "../models/Usage.js";
import { getLimits } from "../config/planLimits.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/usage/status
// Returns current usage counts + plan limits for the logged-in user.
// Frontend uses this to display progress bars and upgrade prompts.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getUsageStatus(req, res) {
    try {
        const userId = req.user._id;
        const userPlan = req.user.plan || "free";
        const limits = getLimits(userPlan);

        // Get current usage (auto-resets stale counters)
        const usage = await Usage.getUsage(userId);

        return res.status(200).json({
            success: true,
            data: {
                plan: userPlan,
                subscriptionStatus: req.user.subscriptionStatus || "none",
                usage: {
                    chat: {
                        used: usage.chatCount,
                        limit: limits.chatPerDay,
                        remaining: Math.max(0, limits.chatPerDay - usage.chatCount),
                        window: "day",
                    },
                    analysis: {
                        used: usage.analysisCount,
                        limit: limits.analysisPerDay,
                        remaining: Math.max(0, limits.analysisPerDay - usage.analysisCount),
                        window: "day",
                    },
                    fir: {
                        used: usage.firCount,
                        limit: limits.firPerMonth,
                        remaining: Math.max(0, limits.firPerMonth - usage.firCount),
                        window: "month",
                    },
                },
                features: {
                    dataPersistence: limits.dataPersistence,
                    exportEnabled: limits.exportEnabled,
                    priorityProcessing: limits.priorityProcessing,
                    ragMemory: limits.ragMemory,
                    maxDocPages: limits.maxDocPages,
                    maxFileSizeMB: limits.maxFileSizeMB,
                    ocrEnabled: limits.ocrEnabled,
                },
            },
        });
    } catch (error) {
        console.error("[usageController] Error fetching usage status:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch usage status",
            error: "USAGE_STATUS_FAILED",
        });
    }
}
