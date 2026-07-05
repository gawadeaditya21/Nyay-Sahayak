import { GoogleGenerativeAI } from '@google/generative-ai';
import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
// Use flash for reranking (cheaper/faster)
const llmModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
const collectionName = process.env.QDRANT_COLLECTION_NAME || 'legal_documents';

/**
 * Service for Hybrid RAG: Semantic (Dense) + Keyword (Sparse) + RRF + LLM Reranking
 */
class HybridRagService {
    
    // Detect if text contains Devanagari (Hindi/Marathi)
    static isIndicLanguage(text) {
        const devanagariRegex = /[\u0900-\u097F]/;
        return devanagariRegex.test(text);
    }

    // Translate query to English
    static async translateToEnglish(query) {
        const prompt = `Translate the following Hindi/Marathi legal query to English accurately. Return ONLY the translated English text, no extra words.\nQuery: ${query}`;
        const result = await llmModel.generateContent(prompt);
        return result.response.text().trim();
    }

    // Embed Query
    static async embedQuery(query) {
        const result = await embeddingModel.embedContent({
            content: { parts: [{ text: query }] },
            outputDimensionality: 768
        });
        return result.embedding.values;
    }

    // Semantic Search (Dense vectors)
    static async denseSearch(vector, limit = 10) {
        try {
            const searchResult = await qdrantClient.search(collectionName, {
                vector: vector,
                limit: limit,
                with_payload: true,
            });
            return searchResult;
        } catch (error) {
            console.error("❌ Qdrant Dense Search Error:", error.message);
            return [];
        }
    }

    // Reciprocal Rank Fusion (RRF)
    // Combines dense search scores with sparse search scores
    static applyRRF(denseResults, sparseResults = [], k = 60) {
        const scores = new Map();
        
        // Add dense scores
        denseResults.forEach((doc, rank) => {
            scores.set(doc.id, {
                doc,
                rrfScore: 1 / (k + rank + 1)
            });
        });

        // Add sparse scores
        sparseResults.forEach((doc, rank) => {
            if (scores.has(doc.id)) {
                scores.get(doc.id).rrfScore += 1 / (k + rank + 1);
            } else {
                scores.set(doc.id, {
                    doc,
                    rrfScore: 1 / (k + rank + 1)
                });
            }
        });

        // Sort by combined RRF score
        return Array.from(scores.values())
            .sort((a, b) => b.rrfScore - a.rrfScore)
            .map(item => item.doc);
    }

    // LLM-based Reranking
    static async rerankResults(query, results, topK = 3) {
        if (results.length === 0) return [];
        
        const contextMap = new Map();
        let contextText = "";
        
        // Limit to top 10 for LLM context window safety
        results.slice(0, 10).forEach((res, i) => {
            contextMap.set(`DOC_${i}`, res);
            contextText += `\n--- DOC_${i} ---\n${res.payload.text.substring(0, 500)}...\n`; // truncate text for token limits
        });

        const prompt = `You are a legal search reranker. Given the user's query and a list of retrieved documents, identify the most relevant documents.
Query: "${query}"

Documents:
${contextText}

Return a strict JSON array of document IDs (e.g., ["DOC_2", "DOC_0", "DOC_5"]) ordered by most relevant to least relevant. Return top ${topK} only. No markdown, just raw JSON array.`;

        try {
            const result = await llmModel.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
            const rankedIds = JSON.parse(responseText);
            
            const rerankedDocs = [];
            for (const docId of rankedIds) {
                if (contextMap.has(docId)) {
                    rerankedDocs.push(contextMap.get(docId));
                }
            }
            
            return rerankedDocs.length > 0 ? rerankedDocs : results.slice(0, topK);
        } catch (error) {
            console.warn("⚠️ Reranking parsing failed, falling back to RRF order.");
            return results.slice(0, topK);
        }
    }

    /**
     * Main Entry point for Hybrid RAG Retrieval
     */
    static async retrieveContext(originalQuery) {
        try {
            let queryToSearch = originalQuery;
            let languageDetected = 'English';

            // 1. Language Detection & Translation
            if (this.isIndicLanguage(originalQuery)) {
                languageDetected = 'Indic';
                console.log(`🌐 Indic language detected. Translating query to English...`);
                queryToSearch = await this.translateToEnglish(originalQuery);
                console.log(`🗣️ Translated Query: ${queryToSearch}`);
            }

            // 2. Embed Query
            console.log(`🧠 Generating embeddings for query...`);
            const vector = await this.embedQuery(queryToSearch);

            // 3. Dense Search (Semantic)
            console.log(`🔍 Performing Semantic Search in Qdrant...`);
            const denseResults = await this.denseSearch(vector, 10);

            // 4. Sparse Search (Simulated for architecture)
            // sparseResults = await this.sparseSearch(queryToSearch, 10);
            const sparseResults = []; // Placeholder until full BM25 tokenization is implemented

            // 5. RRF Fusion
            console.log(`🔀 Applying Reciprocal Rank Fusion (RRF)...`);
            const fusedResults = this.applyRRF(denseResults, sparseResults);

            // 6. LLM Reranking
            console.log(`🎯 Reranking top results using Gemini...`);
            const finalResults = await this.rerankResults(queryToSearch, fusedResults, 4);

            return {
                originalQuery,
                searchQuery: queryToSearch,
                language: languageDetected,
                results: finalResults,
            };

        } catch (error) {
            console.error('❌ Hybrid RAG Retrieval failed:', error);
            throw error;
        }
    }
}

export default HybridRagService;
