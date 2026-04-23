// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PLAN LIMITS — Single source of truth for all subscription tiers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// To change any limit, edit ONLY this file. Every middleware, controller,
// and API endpoint reads from here.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PLAN_LIMITS = {
    free: {
        label: "Free",
        price: 0,
        currency: "INR",

        // Chat
        chatPerDay: 10,

        // FIR
        firPerMonth: 2,

        // Document Analysis
        analysisPerDay: 5,
        maxDocPages: 20,            // max pages per document
        maxFileSizeMB: 15,          // file upload limit
        ocrEnabled: true,           // OCR available
        supportedFormats: ["pdf", "image", "docx"],

        // Storage
        dataPersistence: false,     // chat/analysis history NOT saved

        // Extras
        exportEnabled: false,
        priorityProcessing: false,
        ragMemory: false,           // no advanced RAG context memory
        multilingual: true,
    },

    plus: {
        label: "Plus",
        price: 9900,               // ₹99.00 in paise
        currency: "INR",

        // Chat
        chatPerDay: 50,

        // FIR
        firPerMonth: 10,

        // Document Analysis
        analysisPerDay: 20,
        maxDocPages: 30,
        maxFileSizeMB: 5,
        ocrEnabled: true,
        supportedFormats: ["pdf", "image", "docx"],

        // Storage
        dataPersistence: true,

        // Extras
        exportEnabled: true,
        priorityProcessing: false,
        ragMemory: false,
        multilingual: true,
    },

    pro: {
        label: "Pro",
        price: 19900,              // ₹199.00 in paise
        currency: "INR",

        // Chat
        chatPerDay: Infinity,      // unlimited

        // FIR
        firPerMonth: Infinity,     // unlimited

        // Document Analysis
        analysisPerDay: Infinity,  // unlimited
        maxDocPages: 50,
        maxFileSizeMB: 15,
        ocrEnabled: true,
        supportedFormats: ["pdf", "image", "docx"],

        // Storage
        dataPersistence: true,

        // Extras
        exportEnabled: true,
        priorityProcessing: true,
        ragMemory: true,
        multilingual: true,
    },
};

/**
 * Get the limits object for a given plan name.
 * Falls back to 'free' if the plan is unknown.
 */
export function getLimits(plan) {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Get all plan names.
 */
export function getPlanNames() {
    return Object.keys(PLAN_LIMITS);
}
