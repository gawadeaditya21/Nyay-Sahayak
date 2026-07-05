const { QdrantClient } = require('@qdrant/js-client-rest');
require('dotenv').config();

// Qdrant Configuration
const qdrantConfig = {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    collectionName: process.env.QDRANT_COLLECTION_NAME || 'legal_documents'
};

// Initialize Qdrant Client
let qdrantClient = null;

try {
    if (qdrantConfig.url && qdrantConfig.apiKey) {
        qdrantClient = new QdrantClient({
            url: qdrantConfig.url,
            apiKey: qdrantConfig.apiKey,
        });
        console.log('✅ [Qdrant] Initialized Qdrant Client successfully.');
    } else {
        console.warn('⚠️ [Qdrant] Missing QDRANT_URL or QDRANT_API_KEY in environment variables. Client not initialized.');
    }
} catch (error) {
    console.error('❌ [Qdrant] Failed to initialize Qdrant Client:', error.message);
}

module.exports = {
    qdrantClient,
    qdrantConfig
};
