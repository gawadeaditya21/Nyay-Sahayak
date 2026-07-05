import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

// Resolve directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATA_FILE = path.resolve(__dirname, '../data/enriched_legal_corpus.json');
const BATCH_SIZE = 50; 
const DELAY_MS = 1000; // Delay between batches to respect rate limits

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// We use gemini-embedding-2 with outputDimensionality 768 for compatibility with existing Qdrant collection
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

// Initialize Qdrant
const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
const collectionName = process.env.QDRANT_COLLECTION_NAME || 'legal_documents';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function setupCollection() {
    console.log(`⏳ Checking Qdrant collection: ${collectionName}...`);
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(c => c.name === collectionName);

    if (exists) {
        console.log(`⚠️ Collection ${collectionName} exists. We will delete and recreate it to ensure proper Dense + Sparse schema.`);
        await qdrantClient.deleteCollection(collectionName);
    }

    console.log(`🔨 Creating collection ${collectionName}...`);
    await qdrantClient.createCollection(collectionName, {
        vectors: {
            size: 768,
            distance: 'Cosine',
        },
        // We configure sparse vectors for future Hybrid RAG support
        sparse_vectors: {
            "keyword_sparse": {}
        }
    });
    console.log(`✅ Collection created with Dense and Sparse configurations.`);
}

async function indexData() {
    console.log('🚀 Starting Vector Indexing Process...');

    if (!process.env.GEMINI_API_KEY || !process.env.QDRANT_URL) {
        console.error('❌ Missing API keys in .env file.');
        process.exit(1);
    }

    await setupCollection();

    // Load Data
    let data = [];
    try {
        const rawData = await fs.readFile(DATA_FILE, 'utf-8');
        data = JSON.parse(rawData);
        if (data.length === 0) throw new Error("File is empty.");
        console.log(`✅ Loaded ${data.length} chunks from enriched data.`);
    } catch (error) {
        console.error(`❌ Failed to read enriched data. Have you completed Step 2? Error: ${error.message}`);
        // Fallback to original data just for testing if enriched data is missing
        try {
            console.log("⚠️ Trying to load original raw data as fallback...");
            const FALLBACK_FILE = path.resolve(__dirname, '../../ml-service/dataset/final_chunk.json');
            const rawFallback = await fs.readFile(FALLBACK_FILE, 'utf-8');
            data = JSON.parse(rawFallback).slice(0, 100); // Only process 100 for testing
            console.log(`✅ Loaded ${data.length} chunks from fallback raw data.`);
        } catch (e) {
            process.exit(1);
        }
    }

    let processedCount = 0;

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        console.log(`⏳ Processing batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`);

        try {
            const points = [];

            for (const item of batch) {
                // We embed the main text. We could also append keywords from metadata if available.
                const textToEmbed = item.metadata?.hindi_summary 
                    ? `Text: ${item.text}\nSummary: ${item.metadata.hindi_summary}`
                    : item.text;

                // Embed chunk (Dense Vector) with 768 dims
                const embedResult = await embeddingModel.embedContent({
                    content: { parts: [{ text: textToEmbed }] },
                    outputDimensionality: 768
                });
                const denseVector = embedResult.embedding.values;

                // Simple pseudo-UUID from chunk_id
                const pointId = item.chunk_id.toString().padStart(8, '0') + '-0000-0000-0000-000000000000';

                points.push({
                    id: pointId,
                    vector: {
                        "": denseVector // Default dense vector
                        // Note: To add actual sparse vectors, we would tokenize text here and pass { indices, values } to "keyword_sparse"
                    },
                    payload: {
                        chunk_id: item.chunk_id,
                        text: item.text,
                        metadata: item.metadata || {}
                    }
                });
            }

            // Upsert batch to Qdrant
            await qdrantClient.upsert(collectionName, {
                wait: true,
                points: points
            });

            processedCount += points.length;
            console.log(`💾 Successfully indexed ${processedCount}/${data.length} items.`);

            if (i + BATCH_SIZE < data.length) {
                await delay(DELAY_MS);
            }
        } catch (error) {
            console.error(`❌ Error indexing batch:`, error.message);
            console.log('Continuing with next batch...');
        }
    }

    console.log('🎉 Vector Indexing Complete!');
}

indexData();
