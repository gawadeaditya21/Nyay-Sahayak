const { qdrantClient, qdrantConfig } = require('../config/qdrant.config');

/**
 * Service to handle all interactions with Qdrant Vector DB.
 */
class VectorDBService {
    /**
     * Checks if the Qdrant connection is healthy.
     * @returns {Promise<boolean>} True if connection is healthy.
     */
    static async checkHealth() {
        try {
            if (!qdrantClient) {
                console.error('❌ [VectorDBService] Client not initialized.');
                return false;
            }
            
            // Fetching collection info is a good way to test connection
            // We will also just check cluster health if the method exists or do a simple collections list
            const response = await qdrantClient.getCollections();
            console.log('✅ [VectorDBService] Qdrant connection is healthy. Found collections:', response.collections.map(c => c.name));
            return true;
        } catch (error) {
            console.error('❌ [VectorDBService] Health check failed:', error.message);
            return false;
        }
    }

    /**
     * Creates a new collection in Qdrant if it doesn't exist.
     * We will use text-embedding-004 which outputs 768 dimensions.
     */
    static async initCollection() {
        try {
            if (!qdrantClient) throw new Error('Client not initialized');
            
            const collectionName = qdrantConfig.collectionName;
            
            // Check if collection exists
            const collections = await qdrantClient.getCollections();
            const exists = collections.collections.some(c => c.name === collectionName);
            
            if (!exists) {
                console.log(`⏳ [VectorDBService] Creating collection: ${collectionName}...`);
                // Dense vector configuration for Gemini text-embedding-004 (768 dims)
                await qdrantClient.createCollection(collectionName, {
                    vectors: {
                        size: 768,
                        distance: 'Cosine',
                    },
                    // For Hybrid RAG, we will later configure Sparse Vectors in Step 3
                });
                console.log(`✅ [VectorDBService] Collection ${collectionName} created successfully.`);
            } else {
                console.log(`✅ [VectorDBService] Collection ${collectionName} already exists.`);
            }
        } catch (error) {
            console.error('❌ [VectorDBService] Failed to init collection:', error.message);
            throw error;
        }
    }
}

module.exports = VectorDBService;
