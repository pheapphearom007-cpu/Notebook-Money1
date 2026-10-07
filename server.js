import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleCloudApi } from './scripts/serverApiPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';

  // Handle API routes & OPTIONS preflight
  if (url.startsWith('/api/') || req.method === 'OPTIONS') {
    return handleCloudApi(req, res);
  }

  // Handle Static files from dist
  let sanitizedPath = url.split('?')[0];
  let filePath = path.join(DIST_DIR, sanitizedPath);

  // If path is root or directory
  if (sanitizedPath === '/' || sanitizedPath === '') {
    filePath = path.join(DIST_DIR, 'index.html');
  } else if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // If request has a file extension (e.g. .png, .ico, .js, .css, .json), do not return index.html
    const ext = path.extname(sanitizedPath).toLowerCase();
    if (ext && ext !== '.html') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('File Not Found');
    }
    // Otherwise fallback to index.html for SPA client-side routing
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    return fs.createReadStream(filePath).pipe(res);
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Sievphov Banchy server running on port ${PORT}`);
});
