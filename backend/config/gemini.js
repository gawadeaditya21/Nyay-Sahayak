// config/gemini.js
// Initialize Google Generative AI (Gemini) client
// This file exports a reusable Gemini model instance

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with API key from environment variables
// Make sure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the Gemini model instance
// Using 'gemini-2.5-flash-lite' - Lightweight model with higher free tier quota
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

export { geminiModel, genAI };
