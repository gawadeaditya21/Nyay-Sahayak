import HybridRagService from '../services/hybridRagService.js';

async function runTest() {
    console.log('🚀 Starting Hybrid RAG Test...\n');

    const queries = [
        "What is the punishment for murder?", // English query
        "चोरी की सजा क्या है?", // Hindi query for theft
    ];

    for (const query of queries) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📝 Testing Query: "${query}"`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        
        try {
            const response = await HybridRagService.retrieveContext(query);
            
            console.log(`\n✅ Query Processed Successfully`);
            console.log(`🌐 Detected Language: ${response.language}`);
            if (response.language !== 'English') {
                console.log(`🗣️ Translated Search Query: "${response.searchQuery}"`);
            }
            
            console.log(`\n📄 Top Retrieved Contexts (${response.results.length}):`);
            response.results.forEach((res, index) => {
                console.log(`\n[Rank ${index + 1}] ID: ${res.id}`);
                console.log(`Text preview: ${res.payload.text.substring(0, 150)}...`);
            });

        } catch (error) {
            console.error(`\n❌ Error during retrieval for query "${query}":`, error.message);
        }
    }

    console.log('\n🎉 RAG Testing Complete!');
    process.exit(0);
}

runTest();
