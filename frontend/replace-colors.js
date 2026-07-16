import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'src');

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkAndReplace(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace hardcoded slate backgrounds in omni cards
      content = content.replace(/bg-slate-900\/60/g, 'bg-[var(--color-bg-surface)]/80');
      content = content.replace(/bg-slate-800\/30/g, 'bg-[var(--color-bg-surface)]/30');
      content = content.replace(/hover:bg-slate-800/g, 'hover:bg-[var(--color-bg-surface)]');
      
      // Some other slate-950 and gray-900 backgrounds in pages
      content = content.replace(/bg-slate-950/g, 'bg-[var(--color-bg-main)]');
      content = content.replace(/bg-gray-900/g, 'bg-[var(--color-bg-main)]');
      
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

walkAndReplace(directoryPath);
console.log('Slate Replacement complete.');
