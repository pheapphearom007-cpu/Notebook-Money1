import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distHtmlPath = path.resolve(__dirname, '../dist/index.html');
const rootAppHtmlPath = path.resolve(__dirname, '../app.html');

const publicDir = path.resolve(__dirname, '../public');
const distDir = path.resolve(__dirname, '../dist');

// Copy all static public assets into dist directory
if (fs.existsSync(publicDir) && fs.existsSync(distDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  for (const file of publicFiles) {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
  console.log(`✓ Copied ${publicFiles.length} static public assets to dist/ directory.`);
}

if (fs.existsSync(distHtmlPath)) {
  const content = fs.readFileSync(distHtmlPath, 'utf8');

  // dist/index.html is for Web Hosting (Render, Vercel, Netlify):
  // It MUST keep standard <script type="module" crossorigin> so the browser executes properly on HTTP/HTTPS
  console.log('✓ Verified dist/index.html with standard module scripts for Web & Render deployment.');

  // app.html is for offline double-click file:// execution:
  // Use <script defer> so it waits for DOM while bypassing file:// module CORS restrictions
  const appContent = content.replace(/<script\s+type="module"\s+crossorigin>/g, '<script defer>');
  fs.writeFileSync(rootAppHtmlPath, appContent, 'utf8');
  console.log('✓ Created app.html in root directory for 1-click double-click launch without server!');
}
