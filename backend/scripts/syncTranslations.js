import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Error: GEMINI_API_KEY is not set in backend/.env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const FRONTEND_LOCALES_DIR = path.join(__dirname, '../../frontend/public/locales');
const EN_DIR = path.join(FRONTEND_LOCALES_DIR, 'en');

const SUPPORTED_LANGUAGES = [
  { code: 'hi', label: 'Hindi' },
  { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'or', label: 'Odia' },
  { code: 'ur', label: 'Urdu (RTL script)' },
  { code: 'hinglish', label: 'Hinglish (Hindi written in English alphabet)' }
];

// Deep comparison to find missing keys
function findMissingKeys(source, target) {
  let missing = {};
  let hasMissing = false;

  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      const result = findMissingKeys(source[key], (target && typeof target === 'object') ? target[key] : {});
      if (result.hasMissing) {
        missing[key] = result.missing;
        hasMissing = true;
      }
    } else {
      // If target is missing the key, or target is a completely empty string
      if (!target || target[key] === undefined || target[key] === null || target[key] === '') {
        missing[key] = source[key];
        hasMissing = true;
      }
    }
  }
  return { missing, hasMissing };
}

// Deep merge
function deepMerge(target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Clean JSON response
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '');
    cleaned = cleaned.replace(/```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '');
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
}

async function translateMissingKeys(missingObj, targetLabel) {
  const prompt = `You are a professional localization expert. Translate the following JSON object's values into ${targetLabel}.
  
CRITICAL RULES:
1. ONLY translate the string values. DO NOT translate the JSON keys.
2. Maintain the EXACT JSON structure, nested objects, and arrays.
3. Keep interpolation variables like {{var}} or {{count}} EXACTLY as they are. DO NOT translate them.
4. Output STRICTLY raw JSON. No markdown blocks, no explanations, no text before or after the JSON.

Here is the JSON object to translate:
${JSON.stringify(missingObj, null, 2)}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = cleanJsonResponse(responseText);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error(`\n❌ Error translating to ${targetLabel}:`, error.message);
    console.error('Raw response may not have been valid JSON.');
    return null;
  }
}

async function run() {
  console.log('🚀 Starting i18n Translation Sync...');

  let enFiles = [];
  try {
    enFiles = await fs.readdir(EN_DIR);
    enFiles = enFiles.filter(f => f.endsWith('.json'));
  } catch (err) {
    console.error(`❌ Error reading English locales directory: ${EN_DIR}`);
    process.exit(1);
  }

  for (const file of enFiles) {
    console.log(`\n📄 Processing file: ${file}`);
    const sourceFilePath = path.join(EN_DIR, file);
    const sourceContent = await fs.readFile(sourceFilePath, 'utf8');
    const sourceJson = JSON.parse(sourceContent);

    for (const lang of SUPPORTED_LANGUAGES) {
      const targetDirPath = path.join(FRONTEND_LOCALES_DIR, lang.code);
      const targetFilePath = path.join(targetDirPath, file);

      // Ensure directory exists
      await fs.mkdir(targetDirPath, { recursive: true });

      let targetJson = {};
      try {
        const targetContent = await fs.readFile(targetFilePath, 'utf8');
        targetJson = JSON.parse(targetContent);
      } catch (err) {
        // File doesn't exist or is invalid JSON, start fresh
      }

      const { missing, hasMissing } = findMissingKeys(sourceJson, targetJson);

      if (hasMissing) {
        process.stdout.write(`   🔄 Translating missing keys for ${lang.code} (${lang.label})... `);
        const translatedObj = await translateMissingKeys(missing, lang.label);

        if (translatedObj) {
          const mergedJson = deepMerge(targetJson, translatedObj);
          await fs.writeFile(targetFilePath, JSON.stringify(mergedJson, null, 2), 'utf8');
          console.log(`✅ Done! Saved to ${lang.code}/${file}`);
        } else {
          console.log(`❌ Failed.`);
        }
      } else {
        console.log(`   ✅ ${lang.code} is fully up-to-date.`);
      }
    }
  }

  console.log('\n🎉 Translation sync complete!');
}

run();
