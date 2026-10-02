import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, '../data/cloud_db.json');

// Initialize database file
function initDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    // Seed with a realistic demo user
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync('password123', salt, 1000, 64, 'sha256').toString('hex');
    const demoUser = {
      id: 'user_demo_sovannara',
      name: 'សុខ សុវណ្ណារ៉ា',
      email: 'demo@sievphov.com',
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };

    const initialData = {
      users: [demoUser],
      sessions: [],
      customers: [
        {
          id: 'cust-cloud-1',
          userId: 'user_demo_sovannara',
          name: 'ឈន ពិសិដ្ឋ',
          phone: '012 889 977',
          address: 'ចំបក់ស',
          province: 'ខេត្តសៀមរាប',
          date: '2026-10-01',
          note: 'អតិថិជនកម្ម៉ង់ទំនិញគ្រឿងអេឡិចត្រូនិចបោះដុំចំនួន ២០ ឈុត។ ដឹកជញ្ជូនរៀងរាល់ដើមខែ និងទូទាត់តាម ABA។',
          status: 'active',
          category: 'wholesale',
          priority: 'high',
          email: 'piseth.chhorn@gmail.com',
          telegram: '@piseth_biz',
          balance: 1450.00,
          currency: 'USD',
          history: [
            {
              id: 'hist-1',
              content: 'បានទូទាត់ប្រាក់កក់ $500 រួចរាល់តាម ABA Pay',
              createdAt: '2026-10-01T09:30:00Z',
            }
          ],
          createdAt: '2026-09-15T10:00:00Z',
          updatedAt: '2026-10-02T08:15:00Z',
        },
        {
          id: 'cust-cloud-2',
          userId: 'user_demo_sovannara',
          name: 'អ៊ុំ សារ៉េត',
          phone: '097 554 1122',
          address: 'គោកដូង',
          province: 'ខេត្តសៀមរាប',
          date: '2026-10-02',
          note: 'ទិញសម្ភារកសិកម្មជំពាក់សិន។ សន្យាសងបញ្ចប់នៅចុងខែក្រោយ។',
          status: 'debt',
          category: 'retail',
          priority: 'medium',
          telegram: '0975541122',
          balance: 450.00,
          currency: 'USD',
          history: [],
          createdAt: '2026-10-02T10:00:00Z',
          updatedAt: '2026-10-02T10:00:00Z',
        }
      ],
      notes: [
        {
          id: 'note-cloud-1',
          userId: 'user_demo_sovannara',
          title: 'ផែនការផ្គត់ផ្គង់ទំនិញដើមខែតុលា',
          content: 'ពិនិត្យស្តុកទំនិញគ្រឿងអេឡិចត្រូនិចដែលត្រូវបញ្ជូនទៅអតិថិជន ឈន ពិសិដ្ឋ នៅភូមិចំបក់ស និងរៀបចំវិក្កយបត្រតាម ABA Pay។',
          category: 'ការងារអាជីវកម្ម',
          customerId: 'cust-cloud-1',
          customerName: 'ឈន ពិសិដ្ឋ',
          color: 'yellow',
          isPinned: true,
          createdAt: '2026-10-01T08:00:00Z',
          updatedAt: '2026-10-02T09:00:00Z',
        }
      ],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

function readDb() {
  initDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { users: [], sessions: [], customers: [], notes: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write to database file', err);
  }
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

function authenticateUser(req, db) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const session = (db.sessions || []).find((s) => s.token === token);
  if (!session) return null;

  return (db.users || []).find((u) => u.id === session.userId) || null;
}

export function cloudApiPlugin() {
  return {
    name: 'cloud-api-plugin',
    configureServer(server) {
      initDb();

      server.middlewares.use(async (req, res, next) => {
        // Handle preflight CORS
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          return res.end();
        }

        const url = req.url || '';
        if (!url.startsWith('/api/')) {
          return next();
        }

        const pathname = url.split('?')[0];
        const db = readDb();

        // Health check endpoint
        if (pathname === '/api/health' && req.method === 'GET') {
          return sendJson(res, 200, { status: 'ok', serverTime: new Date().toISOString() });
        }

        // 1. POST /api/auth/register
        if (pathname === '/api/auth/register' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const { name, email, password } = body;

          if (!name?.trim() || !email?.trim() || !password) {
            return sendJson(res, 400, { error: 'Please provide name, email, and password.' });
          }

          const normalizedEmail = email.trim().toLowerCase();
          const existing = (db.users || []).find((u) => u.email.toLowerCase() === normalizedEmail);
          if (existing) {
            return sendJson(res, 409, { error: 'An account with this email address already exists.' });
          }

          const salt = crypto.randomBytes(16).toString('hex');
          const passwordHash = hashPassword(password, salt);
          const user = {
            id: `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            name: name.trim(),
            email: normalizedEmail,
            salt,
            passwordHash,
            createdAt: new Date().toISOString(),
          };

          const token = `siev_${crypto.randomBytes(32).toString('hex')}`;
          const session = {
            token,
            userId: user.id,
            createdAt: new Date().toISOString(),
          };

          db.users = db.users || [];
          db.users.push(user);

          db.sessions = db.sessions || [];
          db.sessions.push(session);

          writeDb(db);

          const { salt: _, passwordHash: __, ...safeUser } = user;
          return sendJson(res, 201, { user: safeUser, token });
        }

        // 2. POST /api/auth/login
        if (pathname === '/api/auth/login' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const { email, password } = body;

          if (!email?.trim() || !password) {
            return sendJson(res, 400, { error: 'Email and password are required.' });
          }

          const normalizedEmail = email.trim().toLowerCase();
          const user = (db.users || []).find((u) => u.email.toLowerCase() === normalizedEmail);
          if (!user) {
            return sendJson(res, 401, { error: 'Invalid email or password.' });
          }

          const expectedHash = hashPassword(password, user.salt);
          if (expectedHash !== user.passwordHash) {
            return sendJson(res, 401, { error: 'Invalid email or password.' });
          }

          const token = `siev_${crypto.randomBytes(32).toString('hex')}`;
          db.sessions = db.sessions || [];
          db.sessions.push({
            token,
            userId: user.id,
            createdAt: new Date().toISOString(),
          });

          writeDb(db);

          const { salt: _, passwordHash: __, ...safeUser } = user;
          return sendJson(res, 200, { user: safeUser, token });
        }

        // 3. GET /api/auth/me
        if (pathname === '/api/auth/me' && req.method === 'GET') {
          const user = authenticateUser(req, db);
          if (!user) {
            return sendJson(res, 401, { error: 'Unauthorized session.' });
          }
          const { salt: _, passwordHash: __, ...safeUser } = user;
          return sendJson(res, 200, { user: safeUser });
        }

        // 4. POST /api/auth/logout
        if (pathname === '/api/auth/logout' && req.method === 'POST') {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();
          if (token && db.sessions) {
            db.sessions = db.sessions.filter((s) => s.token !== token);
            writeDb(db);
          }
          return sendJson(res, 200, { success: true });
        }

        // ==========================================
        // PROTECTED DATA ROUTES (Require User Token)
        // ==========================================
        const user = authenticateUser(req, db);
        if (!user) {
          return sendJson(res, 401, { error: 'Authentication required to access user records.' });
        }

        // 5. GET /api/customers
        if (pathname === '/api/customers' && req.method === 'GET') {
          const userCustomers = (db.customers || []).filter((c) => c.userId === user.id);
          return sendJson(res, 200, userCustomers);
        }

        // 6. POST /api/customers
        if (pathname === '/api/customers' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const now = new Date().toISOString();
          const newCustomer = {
            ...body,
            id: body.id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: user.id, // Strictly bound to authenticated user
            createdAt: body.createdAt || now,
            updatedAt: now,
          };

          db.customers = db.customers || [];
          db.customers.unshift(newCustomer);
          writeDb(db);

          return sendJson(res, 201, newCustomer);
        }

        // 7. PUT /api/customers/:id
        const customerMatch = pathname.match(/^\/api\/customers\/(.+)$/);
        if (customerMatch && req.method === 'PUT') {
          const customerId = customerMatch[1];
          const body = await parseJsonBody(req);
          const now = new Date().toISOString();

          db.customers = db.customers || [];
          const index = db.customers.findIndex((c) => c.id === customerId && c.userId === user.id);
          if (index === -1) {
            return sendJson(res, 404, { error: 'Customer not found or unauthorized.' });
          }

          db.customers[index] = {
            ...db.customers[index],
            ...body,
            userId: user.id, // Prevent altering ownership
            updatedAt: now,
          };
          writeDb(db);

          return sendJson(res, 200, db.customers[index]);
        }

        // 8. DELETE /api/customers/:id
        if (customerMatch && req.method === 'DELETE') {
          const customerId = customerMatch[1];
          db.customers = db.customers || [];
          const index = db.customers.findIndex((c) => c.id === customerId && c.userId === user.id);
          if (index === -1) {
            return sendJson(res, 404, { error: 'Customer not found or unauthorized.' });
          }

          db.customers.splice(index, 1);
          writeDb(db);

          return sendJson(res, 200, { success: true });
        }

        // 9. GET /api/notes
        if (pathname === '/api/notes' && req.method === 'GET') {
          const userNotes = (db.notes || []).filter((n) => n.userId === user.id);
          return sendJson(res, 200, userNotes);
        }

        // 10. POST /api/notes
        if (pathname === '/api/notes' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const now = new Date().toISOString();
          const newNote = {
            ...body,
            id: body.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: user.id,
            createdAt: body.createdAt || now,
            updatedAt: now,
          };

          db.notes = db.notes || [];
          db.notes.unshift(newNote);
          writeDb(db);

          return sendJson(res, 201, newNote);
        }

        // 11. PUT /api/notes/:id
        const noteMatch = pathname.match(/^\/api\/notes\/(.+)$/);
        if (noteMatch && req.method === 'PUT') {
          const noteId = noteMatch[1];
          const body = await parseJsonBody(req);
          const now = new Date().toISOString();

          db.notes = db.notes || [];
          const index = db.notes.findIndex((n) => n.id === noteId && n.userId === user.id);
          if (index === -1) {
            return sendJson(res, 404, { error: 'Note not found or unauthorized.' });
          }

          db.notes[index] = {
            ...db.notes[index],
            ...body,
            userId: user.id,
            updatedAt: now,
          };
          writeDb(db);

          return sendJson(res, 200, db.notes[index]);
        }

        // 12. DELETE /api/notes/:id
        if (noteMatch && req.method === 'DELETE') {
          const noteId = noteMatch[1];
          db.notes = db.notes || [];
          const index = db.notes.findIndex((n) => n.id === noteId && n.userId === user.id);
          if (index === -1) {
            return sendJson(res, 404, { error: 'Note not found or unauthorized.' });
          }

          db.notes.splice(index, 1);
          writeDb(db);

          return sendJson(res, 200, { success: true });
        }

        // 13. POST /api/sync (Batch sync)
        if (pathname === '/api/sync' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const userCustomers = (db.customers || []).filter((c) => c.userId === user.id);
          const userNotes = (db.notes || []).filter((n) => n.userId === user.id);

          return sendJson(res, 200, {
            customers: userCustomers,
            notes: userNotes,
          });
        }

        return sendJson(res, 404, { error: 'Endpoint not found' });
      });
    },
  };
}
