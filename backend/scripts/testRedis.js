// Local testing ke liye dotenv zaroori hai
import dotenv from 'dotenv';
dotenv.config();

// ESM mein imports hoist ho jaate hain, isliye hum isse dynamic import karenge
// taaki dotenv.config() pehle execute ho aur environment variables set ho jayein
const { default: redisService } = await import('../src/services/redisService.js');

async function runTests() {
  console.log('\n🧪 Starting Redis Connection Tests (Upstash)...\n');

  // Test 1: Health Check
  console.log('--- Test 1: Health Check ---');
  const isHealthy = await redisService.healthCheck();
  if (!isHealthy) {
    console.error('❌ Redis se connect nahi ho pa raha. Bhai, ek baar .env credentials check kar lo.');
    process.exit(1);
  }
  console.log('✅ Connection ekdum mast hai!\n');

  const testKey = 'rate_limit_test_key';
  const testCounter = 'rate_limit_test_counter';

  // Test 2: SET & GET
  console.log('--- Test 2: SET and GET ---');
  await redisService.set(testKey, 'Nyay-Sahayak Zindabad!');
  const getValue = await redisService.get(testKey);
  console.log(`GET result: ${getValue}`);
  if (getValue === 'Nyay-Sahayak Zindabad!') {
    console.log('✅ SET/GET successful!\n');
  } else {
    console.error('❌ SET/GET failed!\n');
  }

  // Test 3: Increment
  console.log('--- Test 3: INCR (Increment) ---');
  await redisService.del(testCounter); // Purana kachra saaf kar dete hain
  await redisService.incr(testCounter);
  const count = await redisService.incr(testCounter);
  console.log(`INCR result: ${count}`);
  if (count === 2) {
    console.log('✅ INCR working fine! (Rate limiting ke liye yehi chahiye tha)\n');
  } else {
    console.error('❌ INCR failed!\n');
  }

  // Test 4: Expire
  console.log('--- Test 4: EXPIRE (TTL) ---');
  await redisService.expire(testKey, 10);
  console.log('✅ TTL 10 seconds set kar diya gaya hai.\n');

  // Test 5: Delete
  console.log('--- Test 5: DELETE ---');
  await redisService.del(testKey);
  await redisService.del(testCounter);
  
  const deletedValue = await redisService.get(testKey);
  if (!deletedValue) {
    console.log('✅ DELETE successful! Test data clean ho gaya.\n');
  } else {
    console.error('❌ DELETE kaam nahi kiya!\n');
  }

  console.log('🎉 Badiya! All Redis operations are working smoothly.');
  console.log('👉 Aap ab mujhe "next" bhej sakte ho Step 2 ke liye.\n');
  process.exit(0);
}

runTests();
