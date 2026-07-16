import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  process.loadEnvFile(path.resolve(__dirname, '.env'));
  console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);
  console.log("Length of JWT_SECRET:", process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
} catch(e) {
  console.error("Error loading env:", e.message);
}
