import mongoose from "mongoose";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USAGE MODEL — Tracks daily / monthly feature usage per user
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Design:
//   - One document per user (upserted on first use).
//   - Daily counters (chat, analysis) store the count + the date string
//     they belong to. When the date string changes → counter resets to 0.
//   - Monthly counters (fir) use year-month string for the same logic.
//   - No aggregation needed. Simple findOne + updateOne.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const UsageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        // ── Daily counters ──────────────────────────────────────────
        chatCount: { type: Number, default: 0 },
        chatDate: { type: String, default: "" },         // "2026-04-24"

        analysisCount: { type: Number, default: 0 },
        analysisDate: { type: String, default: "" },     // "2026-04-24"

        // ── Monthly counters ────────────────────────────────────────
        firCount: { type: Number, default: 0 },
        firMonth: { type: String, default: "" },         // "2026-04"
    },
    { timestamps: true }
);

// ── Helper: get today's date string (IST-aware) ──────────────────────
function todayString() {
    // Use IST offset (+5:30) so resets happen at midnight India time
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    return ist.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function currentMonthString() {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    return ist.toISOString().slice(0, 7); // "YYYY-MM"
}

// ── Static method: get current usage (resets stale counters) ─────────
UsageSchema.statics.getUsage = async function (userId) {
    let usage = await this.findOne({ userId });

    if (!usage) {
        usage = await this.create({ userId });
    }

    const today = todayString();
    const month = currentMonthString();
    let needsSave = false;

    // Reset daily counters if the date has rolled over
    if (usage.chatDate !== today) {
        usage.chatCount = 0;
        usage.chatDate = today;
        needsSave = true;
    }
    if (usage.analysisDate !== today) {
        usage.analysisCount = 0;
        usage.analysisDate = today;
        needsSave = true;
    }

    // Reset monthly counter if the month has rolled over
    if (usage.firMonth !== month) {
        usage.firCount = 0;
        usage.firMonth = month;
        needsSave = true;
    }

    if (needsSave) {
        await usage.save();
    }

    return usage;
};

// ── Static method: increment a specific counter ──────────────────────
// Returns { allowed, current, limit } so the middleware can decide.
UsageSchema.statics.increment = async function (userId, featureType) {
    const usage = await this.getUsage(userId);

    const fieldMap = {
        chat: "chatCount",
        analysis: "analysisCount",
        fir: "firCount",
    };

    const field = fieldMap[featureType];
    if (!field) {
        throw new Error(`Unknown feature type: ${featureType}`);
    }

    usage[field] += 1;
    await usage.save();

    return usage[field]; // return the new count
};

export default mongoose.model("Usage", UsageSchema);
