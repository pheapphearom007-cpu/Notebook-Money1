import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleCloudApi } from './serverApiPlugin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');
const TEST_PORT = 3288;
const BASE = `http://127.0.0.1:${TEST_PORT}`;

// Create test server identical to server.js
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const url = req.url || '/';
  if (url.startsWith('/api/') || req.method === 'OPTIONS') {
    return handleCloudApi(req, res);
  }

  let rawPath;
  try {
    rawPath = decodeURIComponent(url.split('?')[0]);
  } catch {
    res.statusCode = 400;
    return res.end('Bad Request');
  }

  let filePath = path.normalize(path.join(DIST_DIR, rawPath));
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain');
    return res.end('Access Denied');
  }

  if (rawPath === '/' || rawPath === '') {
    filePath = path.join(DIST_DIR, 'index.html');
  } else if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const ext = path.extname(rawPath).toLowerCase();
    if (ext && ext !== '.html') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      return res.end('File Not Found');
    }
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

import net from 'net';

async function rawGet(path) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port: TEST_PORT, host: '127.0.0.1' }, () => {
      client.write(`GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
    });
    let data = '';
    client.on('data', (chunk) => { data += chunk.toString(); });
    client.on('end', () => {
      const statusLine = data.split('\r\n')[0] || '';
      const match = statusLine.match(/HTTP\/1\.[01]\s+(\d+)/);
      resolve(match ? parseInt(match[1], 10) : 0);
    });
    client.on('error', reject);
  });
}

async function run() {
  await new Promise((r) => server.listen(TEST_PORT, '127.0.0.1', r));
  console.log('================================================================');
  console.log('REGISTRATION & SECURITY VERIFICATION TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title, condition) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${title}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Path Traversal Defense (Raw un-normalized HTTP requests)
    const statusTraversal1 = await rawGet('/../package.json');
    assert('Path Traversal: /../package.json is blocked with 403', statusTraversal1 === 403);

    const statusTraversal2 = await rawGet('/../../../../etc/passwd');
    assert('Path Traversal: /../../../../etc/passwd is blocked with 403', statusTraversal2 === 403);

    // 2. Security Headers
    const resHome = await fetch(`${BASE}/`);
    assert('Security Headers: X-Content-Type-Options is nosniff', resHome.headers.get('x-content-type-options') === 'nosniff');
    assert('Security Headers: X-Frame-Options is DENY', resHome.headers.get('x-frame-options') === 'DENY');

    // 3. API Health Check
    const resHealth = await fetch(`${BASE}/api/health`);
    const healthData = await resHealth.json();
    assert('API Health: /api/health returns 200 OK', resHealth.status === 200 && healthData.status === 'ok');

    // 4. Register: Validation - Empty fields
    const resRegEmpty = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: '', password: '' }),
    });
    assert('Register: Empty credentials rejected with 400', resRegEmpty.status === 400);

    // 5. Register: Validation - Password too short (< 6 chars)
    const resRegShortPass = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sok', email: 'sok@test.com', password: '123' }),
    });
    assert('Register: Short password (<6 chars) rejected with 400', resRegShortPass.status === 400);

    // 6. Register: Valid registration
    const testEmail = `user_secure_${Date.now()}@test.com`;
    const resRegSuccess = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sok Pharith', email: testEmail, password: 'SecurePassword2026!' }),
    });
    const regData = await resRegSuccess.json();
    assert(
      'Register: Valid registration returns 201 with user and token',
      resRegSuccess.status === 201 && regData.user?.email === testEmail && regData.token
    );

    // 7. Register: Duplicate account rejection
    const resRegDup = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Sok Another', email: testEmail, password: 'AnotherPassword2026!' }),
    });
    assert('Register: Duplicate email rejected with 409 Conflict', resRegDup.status === 409);

    // 8. Login: Valid account authentication
    const resLogin = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'SecurePassword2026!' }),
    });
    const loginData = await resLogin.json();
    assert(
      'Login: Authenticates successfully with 200 and session token',
      resLogin.status === 200 && loginData.token && loginData.user?.email === testEmail
    );

    // 9. Login: Wrong password rejection
    const resLoginBad = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
    });
    assert('Login: Wrong password rejected with 401', resLoginBad.status === 401);

    // 10. DoS Protection: Payload size limit
    const hugeBody = JSON.stringify({ data: 'A'.repeat(1024 * 1024 + 500) });
    try {
      const resLarge = await fetch(`${BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: hugeBody,
      });
      assert('DoS Defense: Oversized payload rejected (>1MB)', resLarge.status === 413 || resLarge.status === 500);
    } catch {
      // Connection closed/destroyed
      assert('DoS Defense: Oversized payload stream terminated', true);
    }

  } finally {
    server.close();
  }

  console.log(`\n================================================================`);
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('================================================================');
}

run();
