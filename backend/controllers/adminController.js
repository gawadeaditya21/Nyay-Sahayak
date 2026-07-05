import { extractTextFromPDF } from '../utils/fileExtractor.js';
import { chunkText } from '../services/aiService.js';
import HybridRagService from '../services/hybridRagService.js';
import { QdrantClient } from '@qdrant/js-client-rest';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
const collectionName = process.env.QDRANT_COLLECTION_NAME || 'legal_documents';

/**
 * Uploads a new law (PDF) into the Qdrant Vector Database
 */
export const uploadLaw = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const filePath = req.file.path;
        const mimeType = req.file.mimetype;
        const metadataTitle = req.body.title || req.file.originalname;
        const actName = req.body.actName || "Unknown Act";

        let text = "";
        
        if (mimeType === "application/pdf") {
            const result = await extractTextFromPDF(filePath);
            text = result.text;
        } else {
            // Can be expanded to docx or JSON
            return res.status(400).json({ success: false, message: "Currently only PDF laws are supported." });
        }

        console.log(`[Admin] Chunking uploaded law: ${metadataTitle}...`);
        
        // Use aiService's chunkText
        const chunks = chunkText(text, 1200); 

        console.log(`[Admin] Generated ${chunks.length} chunks. Embedding and uploading to Qdrant...`);

        const points = [];
        
        // Generate embeddings for each chunk and upload in batches
        for (let i = 0; i < chunks.length; i++) {
            // Generate deterministic or random UUID
            const chunkId = crypto.randomUUID();
            
            // Add metadata context to the chunk for better embedding
            const textToEmbed = `Title: ${metadataTitle}\nAct: ${actName}\n\n${chunks[i]}`;
            
            // Generate dense vector using HybridRagService's embedding model
            const vector = await HybridRagService.embedQuery(textToEmbed);
            
            points.push({
                id: chunkId,
                vector: vector,
                payload: {
                    text: chunks[i],
                    metadata: {
                        act: actName,
                        title: metadataTitle,
                        source: "admin_upload",
                        chunk_index: i
                    }
                }
            });
            
            // Throttle slightly to respect API rate limits (e.g. 50ms)
            await new Promise(r => setTimeout(r, 50));
        }

        // Batch upload
        const batchSize = 25;
        for (let i = 0; i < points.length; i += batchSize) {
            const batch = points.slice(i, i + batchSize);
            await qdrantClient.upsert(collectionName, {
                wait: true,
                points: batch
            });
            console.log(`[Admin] Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(points.length/batchSize)}`);
        }

        console.log(`✅ [Admin] Law uploaded successfully: ${points.length} chunks added to Qdrant.`);

        res.status(200).json({
            success: true,
            message: `Law '${metadataTitle}' processed and indexed successfully.`,
            chunks_added: points.length
        });
        
    } catch (error) {
        console.error("❌ [Admin] Upload failed:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
