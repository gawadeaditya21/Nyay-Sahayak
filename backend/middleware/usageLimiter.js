import Usage from "../models/Usage.js";
import { getLimits } from "../config/planLimits.js";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USAGE LIMITER MIDDLEWARE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Usage:
//   router.post("/", protect, usageLimiter("chat"), controller);
//   router.post("/", protect, usageLimiter("fir"),  controller);
//   router.post("/", protect, usageLimiter("analysis"), controller);
//
// What it does:
//   1. Reads user's plan from req.user (set by authMiddleware.protect)
//   2. Looks up the plan's limit for the given feature
//   3. Reads current usage count from the Usage model
//   4. If under limit → increments counter, attaches plan info to req, calls next()
//   5. If over limit → returns 403 with clear upgrade message
//
// IMPORTANT: This middleware MUST be placed AFTER `protect` middleware
// because it needs req.user to exist.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Map feature type → { limitKey, countField, windowLabel }
const FEATURE_CONFIG = {
    chat: {
        limitKey: "chatPerDay",
        countField: "chatCount",
        windowLabel: "today",
    },
    analysis: {
        limitKey: "analysisPerDay",
        countField: "analysisCount",
        windowLabel: "today",
    },
    fir: {
        limitKey: "firPerMonth",
        countField: "firCount",
        windowLabel: "this month",
    },
};

export function usageLimiter(featureType) {
    const config = FEATURE_CONFIG[featureType];
    if (!config) {
        throw new Error(`[usageLimiter] Unknown feature type: "${featureType}"`);
    }

    return async (req, res, next) => {
        try {
            // If user is not authenticated (guest), skip this middleware.
            // Guest limits are handled separately by guestLimits.js in the controllers.
            if (!req.user || !req.user._id) {
                return next();
            }

            const userPlan = req.user.plan || "free";
            const limits = getLimits(userPlan);
            const maxAllowed = limits[config.limitKey];

            // Pro users with Infinity limit — skip DB check entirely
            if (maxAllowed === Infinity) {
                req.planInfo = { plan: userPlan, limits };
                return next();
            }

            // Get current usage (auto-resets stale daily/monthly counters)
            const usage = await Usage.getUsage(req.user._id);
            const currentCount = usage[config.countField];

            if (currentCount >= maxAllowed) {
                const upgradeHint = userPlan === "free"
                    ? "Upgrade to Plus or Pro for higher limits."
                    : userPlan === "plus"
                        ? "Upgrade to Pro for unlimited access."
                        : "";

                return res.status(403).json({
                    success: false,
                    message: `You have reached your ${featureType} limit for ${config.windowLabel} (${currentCount}/${maxAllowed}). ${upgradeHint}`.trim(),
                    error: "USAGE_LIMIT_EXCEEDED",
                    usage: {
                        feature: featureType,
                        current: currentCount,
                        limit: maxAllowed,
                        plan: userPlan,
                        window: config.windowLabel,
                    },
                });
            }

            // Increment the counter
            await Usage.increment(req.user._id, featureType);

            // Attach plan info for downstream controllers (optional use)
            req.planInfo = { plan: userPlan, limits };

            next();
        } catch (error) {
            console.error(`[usageLimiter] Error checking ${featureType} usage:`, error.message);
            // On error, allow the request through rather than blocking a paying user
            next();
        }
    };
}
