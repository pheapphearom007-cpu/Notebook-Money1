import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distHtmlPath = path.resolve(__dirname, '../dist/index.html');
const rootAppHtmlPath = path.resolve(__dirname, '../app.html');

if (fs.existsSync(distHtmlPath)) {
  let content = fs.readFileSync(distHtmlPath, 'utf8');

  // Replace type="module" crossorigin with universal <script>
  // This removes browser CORS blocking when opening directly via file://
  content = content.replace(/<script\s+type="module"\s+crossorigin>/g, '<script>');

  fs.writeFileSync(distHtmlPath, content, 'utf8');
  console.log('✓ Successfully enhanced dist/index.html for universal file:// and http:// execution!');

  // Also write app.html in the root directory for instant double-click access
  fs.writeFileSync(rootAppHtmlPath, content, 'utf8');
  console.log('✓ Created app.html in root directory for 1-click double-click launch without server!');
}
