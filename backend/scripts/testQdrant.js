const VectorDBService = require('../services/vectorDBService');

/**
 * Simple script to test the Qdrant Cloud connection.
 */
async function runTest() {
    console.log('🚀 Starting Qdrant Connection Test...\n');
    
    try {
        console.log('1️⃣ Checking Health...');
        const isHealthy = await VectorDBService.checkHealth();
        
        if (isHealthy) {
            console.log('\n2️⃣ Initializing Collection (will create if missing)...');
            await VectorDBService.initCollection();
            console.log('\n🎉 ALL TESTS PASSED! Qdrant is ready to go!');
        } else {
            console.log('\n❌ Health check failed. Please verify your .env credentials.');
        }
    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
    } finally {
        process.exit(0);
    }
}

runTest();
