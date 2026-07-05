import { GoogleGenerativeAI } from '@google/generative-ai';
import HybridRagService from './hybridRagService.js';
import { generateComplaintLetter } from './aiService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define System Prompt with Anti-Hallucination Guardrails & IPC/BNS Duality
const systemInstruction = `You are Nyay-Sahayak, a Senior Indian Legal AI Assistant.
Your primary role is to assist users with legal queries, document analysis, and FIR drafting.

⚠️ CRITICAL ANTI-HALLUCINATION GUARDRAILS:
1. Cite ONLY sections from the retrieved context using your tools.
2. If the context does not contain the answer, explicitly state: "I need to research further" or "I do not have enough information." NEVER invent or hallucinate law sections.
3. Indian laws are transitioning. ALWAYS mention both if applicable (e.g., "Under old IPC section X (pre-July 2024) or new BNS section Y (post-July 2024)").
4. If a user's query is vague (e.g., "help me", "what should I do?"), ask clarifying questions to understand their situation before using tools.

You have access to tools:
- search_laws: Use this to search the vector database for legal context.
- draft_fir: Use this to generate a formal police complaint if the user asks to draft one.
`;

const tools = [
    {
        functionDeclarations: [
            {
                name: "search_laws",
                description: "Search the vector database for relevant Indian laws, IPC, BNS, or legal context.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: { type: "STRING", description: "The legal query or situation to search for" }
                    },
                    required: ["query"]
                }
            },
            {
                name: "draft_fir",
                description: "Draft an FIR (First Information Report) or police complaint based on an incident description.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        incident_description: { type: "STRING", description: "Detailed description of the incident" }
                    },
                    required: ["incident_description"]
                }
            }
        ]
    }
];

// Initialize the Agent Model
const agentModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite", // Use available model in 2026 API
    systemInstruction,
    tools
});

export class AgentService {
    /**
     * Handle a user query using the Tool-Calling Agent.
     */
    static async handleUserQuery(userMessage, chatHistory = []) {
        try {
            // Start chat session with history
            const chat = agentModel.startChat({ history: chatHistory });
            
            console.log(`\n🤖 [Agent] Received User Message: "${userMessage}"`);
            
            let result = await chat.sendMessage(userMessage);
            let response = result.response;
            
            // 🔄 Tool Call Loop
            let toolCalls = response.functionCalls();
            
            while (toolCalls && toolCalls.length > 0) {
                const call = toolCalls[0];
                console.log(`🔧 [Agent] LLM requested tool: ${call.name} with args:`, call.args);
                
                let toolResult = {};
                
                try {
                    if (call.name === "search_laws") {
                        const ragRes = await HybridRagService.retrieveContext(call.args.query);
                        toolResult = {
                            laws_found: ragRes.results.map((r, i) => `Source ${i+1}:\n${r.payload.text}`).join('\n\n') || "No specific laws found in database."
                        };
                    } else if (call.name === "draft_fir") {
                        const draft = await generateComplaintLetter({ incidentDescription: call.args.incident_description }, { language: "en" });
                        toolResult = { draft_content: draft };
                    } else {
                        toolResult = { error: "Unknown tool" };
                    }
                } catch (toolError) {
                    console.error(`❌ [Agent] Tool execution failed:`, toolError.message);
                    toolResult = { error: `Failed to execute ${call.name}: ${toolError.message}` };
                }
                
                console.log(`📤 [Agent] Returning tool results to LLM...`);
                
                // Send tool response back to LLM so it can generate the final answer
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: call.name,
                        response: toolResult
                    }
                }]);
                
                response = result.response;
                toolCalls = response.functionCalls(); // Check if LLM wants to call another tool
            }
            
            console.log(`✅ [Agent] Final Response Generated.`);
            return response.text();
            
        } catch (error) {
            console.error('❌ [Agent] Error in handleUserQuery:', error);
            throw error;
        }
    }
}

export default AgentService;
