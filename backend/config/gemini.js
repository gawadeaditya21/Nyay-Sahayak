// config/gemini.js
// Initialize Google Generative AI (Gemini) client
// This file exports a reusable Gemini model instance

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with API key from environment variables
// Make sure GEMINI_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the Gemini model instance
// Using 'gemini-1.5-flash' for faster responses and lower cost
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export { geminiModel, genAI };
