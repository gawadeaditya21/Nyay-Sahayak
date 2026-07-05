import AgentService from '../services/agentService.js';

async function runTest() {
    console.log('🚀 Starting Agent Test...\n');
    
    // Simulating a conversation
    let chatHistory = [];
    
    // Scenario 1: Vague Question (Edge Case 4)
    let userMessage = "help me";
    let response = await AgentService.handleUserQuery(userMessage, chatHistory);
    console.log(`\n🤖 AI: ${response}\n`);
    
    // Update history manually for testing (In production, SDK manages this or we pass it)
    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    chatHistory.push({ role: "model", parts: [{ text: response }] });
    
    // Scenario 2: Specific Legal Query (Edge Case 1 & 2)
    userMessage = "Someone stole my phone from my desk. What is the punishment?";
    response = await AgentService.handleUserQuery(userMessage, chatHistory);
    console.log(`\n🤖 AI: ${response}\n`);
    
    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    chatHistory.push({ role: "model", parts: [{ text: response }] });
    
    // Scenario 3: Draft FIR Tool
    userMessage = "Please draft an FIR for this theft.";
    response = await AgentService.handleUserQuery(userMessage, chatHistory);
    console.log(`\n🤖 AI: ${response}\n`);

    console.log('🎉 Agent Testing Complete!');
    process.exit(0);
}

runTest();
