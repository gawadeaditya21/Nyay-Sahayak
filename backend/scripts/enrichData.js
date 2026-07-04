import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Resolve directory paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BATCH_SAVE_INTERVAL = 10; // Save every 10 items
const DELAY_MS = 2000; // 2 seconds delay to avoid rate limit (Google's free tier has limits)

const SOURCE_FILE = path.resolve(__dirname, '../../ml-service/dataset/final_chunk.json');
const DATA_DIR = path.resolve(__dirname, '../data');
const TARGET_FILE = path.join(DATA_DIR, 'enriched_legal_corpus.json');

// Initialize Gemini
// NOTE: Make sure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use flash for faster/cheaper large scale processing
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Helper for delay
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function enrichData() {
    console.log('🚀 Starting Data Enrichment Process...');

    if (!process.env.GEMINI_API_KEY) {
        console.error('❌ GEMINI_API_KEY is missing in .env file.');
        process.exit(1);
    }

    // 1. Ensure data dir exists
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`📁 Created directory: ${DATA_DIR}`);
    }

    // 2. Load Source Data
    let sourceData = [];
    try {
        const rawSource = await fs.readFile(SOURCE_FILE, 'utf-8');
        sourceData = JSON.parse(rawSource);
        console.log(`✅ Loaded source data: ${sourceData.length} chunks found.`);
    } catch (error) {
        console.error(`❌ Failed to read source file at ${SOURCE_FILE}:`, error.message);
        process.exit(1);
    }

    // 3. Load Checkpoint Data
    let enrichedData = [];
    try {
        const rawTarget = await fs.readFile(TARGET_FILE, 'utf-8');
        enrichedData = JSON.parse(rawTarget);
        console.log(`✅ Found existing checkpoint: ${enrichedData.length} chunks already enriched.`);
    } catch {
        console.log('ℹ️ No existing checkpoint found. Starting from scratch.');
    }

    // 4. Start Processing
    const startIdx = enrichedData.length;
    
    if (startIdx >= sourceData.length) {
        console.log('🎉 All data has already been enriched!');
        return;
    }

    const systemPrompt = `You are a Senior Indian Legal Expert. Analyze the provided legal text (which may be a section of IPC or general legal commentary).
Extract and generate the following information in strict JSON format:
{
  "hindi_summary": "A brief summary of the text in Hindi (Devanagari script)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "scenarios": ["A real-world example scenario 1", "Real-world scenario 2"],
  "punishment": "Details of punishment if mentioned, else 'Not Applicable'",
  "bns_equivalent": "BNS section equivalent if it's an IPC section, else 'Not Applicable'"
}
Return ONLY valid JSON. No markdown formatting, no backticks, just the raw JSON object.`;

    for (let i = startIdx; i < sourceData.length; i++) {
        const chunk = sourceData[i];
        console.log(`⏳ Processing chunk ${i + 1}/${sourceData.length} (ID: ${chunk.chunk_id})...`);

        try {
            const prompt = `${systemPrompt}\n\nLEGAL TEXT:\n${chunk.text}`;
            const result = await model.generateContent(prompt);
            const responseText = result.response.text().trim();
            
            // Clean up possible markdown code blocks
            const jsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            let enrichedMeta;
            try {
                enrichedMeta = JSON.parse(jsonStr);
            } catch (parseError) {
                console.warn(`⚠️ Failed to parse JSON for chunk ${chunk.chunk_id}. Storing raw response.`);
                enrichedMeta = { raw_response: responseText };
            }

            // Merge original chunk with enriched data
            const enrichedChunk = {
                ...chunk,
                metadata: {
                    ...enrichedMeta,
                    processed_at: new Date().toISOString()
                }
            };

            enrichedData.push(enrichedChunk);

            // Checkpoint saving
            if ((i + 1) % BATCH_SAVE_INTERVAL === 0 || (i + 1) === sourceData.length) {
                await fs.writeFile(TARGET_FILE, JSON.stringify(enrichedData, null, 2));
                console.log(`💾 Checkpoint saved at chunk ${i + 1}.`);
            }

            // Rate limit delay
            if ((i + 1) !== sourceData.length) {
                await delay(DELAY_MS);
            }

        } catch (error) {
            console.error(`❌ Error processing chunk ${chunk.chunk_id}:`, error.message);
            // Save current progress before failing
            await fs.writeFile(TARGET_FILE, JSON.stringify(enrichedData, null, 2));
            console.log(`💾 Emergency checkpoint saved at chunk ${i}. Exiting to prevent further errors.`);
            process.exit(1);
        }
    }

    console.log('🎉 Enrichment complete! All chunks processed and saved.');
}

enrichData();
