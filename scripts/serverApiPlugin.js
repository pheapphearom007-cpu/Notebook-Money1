import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

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
      resetTokens: [],
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
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      users: data.users || [],
      sessions: data.sessions || [],
      resetTokens: data.resetTokens || [],
      customers: data.customers || [],
      notes: data.notes || [],
    };
  } catch {
    return { users: [], sessions: [], resetTokens: [], customers: [], notes: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write to database file', err);
  }
}

function hashPassword(password, salt, iterations = 100000) {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha256').toString('hex');
}

function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  // Try 100,000 iterations first (new standard)
  const hash100k = hashPassword(password, salt, 100000);
  if (hash100k.length === storedHash.length && crypto.timingSafeEqual(Buffer.from(hash100k, 'hex'), Buffer.from(storedHash, 'hex'))) {
    return true;
  }
  // Fallback to legacy 1,000 iterations for existing users
  const hashLegacy = hashPassword(password, salt, 1000);
  if (hashLegacy.length === storedHash.length && crypto.timingSafeEqual(Buffer.from(hashLegacy, 'hex'), Buffer.from(storedHash, 'hex'))) {
    return true;
  }
  return false;
}

let mailTransporter = null;

function getMailTransporter() {
  if (mailTransporter) return mailTransporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      mailTransporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      return mailTransporter;
    } catch (e) {
      console.error('Failed to initialize nodemailer transport', e);
      return null;
    }
  }
  return null;
}

function getAppBaseUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const origin = req.headers['origin'] || req.headers['referer'];
  if (origin) {
    try {
      const u = new URL(origin);
      return `${u.protocol}//${u.host}`;
    } catch {}
  }
  const host = req.headers['host'];
  const proto = req.headers['x-forwarded-proto'] || (req.connection && req.connection.encrypted ? 'https' : 'http');
  if (host) {
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

async function sendResetEmail(email, resetLink) {
  const transporter = getMailTransporter();
  const from = process.env.SMTP_FROM || '"សៀវភៅបញ្ជី (Sievphov Banchy)" <no-reply@sievphov.com>';
  const subject = 'កំណត់ពាក្យសម្ងាត់ឡើងវិញ - Sievphov Banchy Password Reset';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e0d4; border-radius: 12px; background-color: #fffcf8; color: #1c1917;">
      <h2 style="color: #1f3d5c; margin-top: 0;">សៀវភៅបញ្ជី (Sievphov Banchy)</h2>
      <p style="font-size: 15px; line-height: 1.6;">យើងបានទទួលសំណើសុំកំណត់ពាក្យសម្ងាត់ឡើងវិញសម្រាប់គណនីរបស់អ្នក (${email})។</p>
      <p style="font-size: 15px; line-height: 1.6;">សូមចុចលើប៊ូតុងខាងក្រោមដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី (តំណរភ្ជាប់នេះមានសុពលភាពរយៈពេល 1 ម៉ោង):</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetLink}" style="background-color: #1f3d5c; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">កំណត់ពាក្យសម្ងាត់ថ្មី (Reset Password)</a>
      </div>
      <p style="font-size: 13px; color: #57534e; line-height: 1.5;">ប្រសិនបើអ្នកមិនបានស្នើសុំកំណត់ពាក្យសម្ងាត់នេះទេ សូមរំលងសារនេះ។ គណនីរបស់អ្នកនៅតែមានសុវត្ថិភាព។</p>
      <hr style="border: none; border-top: 1px solid #e7e0d4; margin: 24px 0;" />
      <p style="font-size: 12px; color: #857f77;">តំណរភ្ជាប់ផ្ទាល់៖ <a href="${resetLink}" style="color: #1f3d5c;">${resetLink}</a></p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        subject,
        html,
        text: `សូមចុចលើតំណរភ្ជាប់នេះដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី: ${resetLink}`,
      });
      console.log(`✓ Password reset email dispatched to ${email} via SMTP.`);
      return { sent: true };
    } catch (err) {
      console.error(`✗ SMTP dispatch failed for ${email}:`, err.message);
      console.log(`[AUTH FALLBACK LINK] Reset link for ${email}: ${resetLink}`);
      return { sent: false, error: err.message };
    }
  } else {
    console.log(`\n======================================================`);
    console.log(`[AUTH] Password Reset Requested for: ${email}`);
    console.log(`[AUTH] Reset Link: ${resetLink}`);
    console.log(`[AUTH] Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env for production emails.`);
    console.log(`======================================================\n`);
    return { sent: false, logged: true };
  }
}

const MAX_BODY_SIZE = 1024 * 1024; // 1MB payload limit
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30-day session lifetime

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        req.destroy();
        resolve({ __bodyTooLarge: true });
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => {
      resolve({});
    });
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
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

  // Session TTL Expiration check
  if (session.createdAt) {
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    if (sessionAge > SESSION_TTL_MS) {
      return null;
    }
  }

  return (db.users || []).find((u) => u.id === session.userId) || null;
}

export async function handleCloudApi(req, res) {
  initDb();

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
    return false;
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
          if (body.__bodyTooLarge) {
            return sendJson(res, 413, { error: 'Payload too large. Maximum size is 1MB.' });
          }
          const { name, email, password } = body;

          if (!name?.trim() || !email?.trim() || !password) {
            return sendJson(res, 400, { error: 'Please provide name, email, and password.' });
          }

          if (password.length < 6) {
            return sendJson(res, 400, { error: 'Password must be at least 6 characters.' });
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

          if (!verifyPassword(password, user.salt, user.passwordHash)) {
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

        // 4a. POST /api/auth/forgot-password
        if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const { email } = body;

          if (!email?.trim()) {
            return sendJson(res, 400, { error: 'Email address is required.' });
          }

          const normalizedEmail = email.trim().toLowerCase();
          const user = (db.users || []).find((u) => u.email.toLowerCase() === normalizedEmail);

          let devResetUrl = undefined;
          if (user) {
            // Invalidate any previous unused tokens for this user
            db.resetTokens = (db.resetTokens || []).map((t) =>
              t.userId === user.id && !t.used ? { ...t, used: true } : t
            );

            const token = crypto.randomBytes(32).toString('hex');
            const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour expiration
            const resetRecord = {
              token,
              userId: user.id,
              email: user.email,
              expiresAt,
              used: false,
              createdAt: new Date().toISOString(),
            };
            db.resetTokens.push(resetRecord);
            writeDb(db);

            const baseUrl = getAppBaseUrl(req);
            const resetLink = `${baseUrl}/?token=${token}`;
            devResetUrl = resetLink;

            await sendResetEmail(user.email, resetLink);
          } else {
            // Subtle timing mitigation to prevent user enumeration
            await new Promise((r) => setTimeout(r, 200));
          }

          return sendJson(res, 200, {
            success: true,
            message: 'If an account matches that email address, a password reset link has been sent.',
            ...(process.env.NODE_ENV !== 'production' && devResetUrl ? { devResetUrl } : {}),
          });
        }

        // 4b. GET /api/auth/verify-reset-token
        if (pathname === '/api/auth/verify-reset-token' && req.method === 'GET') {
          const urlObj = new URL(req.url, 'http://localhost');
          const token = (urlObj.searchParams.get('token') || '').trim();

          if (!token) {
            return sendJson(res, 400, { valid: false, error: 'Token is required.' });
          }

          const record = (db.resetTokens || []).find((t) => t.token === token);
          if (!record) {
            return sendJson(res, 400, { valid: false, error: 'Invalid password reset token.' });
          }

          if (record.used) {
            return sendJson(res, 400, { valid: false, error: 'This password reset link has already been used.' });
          }

          if (Date.now() > record.expiresAt) {
            return sendJson(res, 400, { valid: false, error: 'This password reset link has expired.' });
          }

          return sendJson(res, 200, { valid: true, email: record.email });
        }

        // 4c. POST /api/auth/reset-password
        if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const { token, newPassword } = body;

          if (!token || !newPassword) {
            return sendJson(res, 400, { error: 'Token and new password are required.' });
          }

          if (newPassword.length < 6) {
            return sendJson(res, 400, { error: 'Password must be at least 6 characters.' });
          }

          const record = (db.resetTokens || []).find((t) => t.token === token.trim());
          if (!record) {
            return sendJson(res, 400, { error: 'Invalid password reset token.' });
          }

          if (record.used) {
            return sendJson(res, 400, { error: 'This password reset link has already been used.' });
          }

          if (Date.now() > record.expiresAt) {
            return sendJson(res, 400, { error: 'This password reset link has expired. Please request a new one.' });
          }

          const userIndex = (db.users || []).findIndex((u) => u.id === record.userId);
          if (userIndex === -1) {
            return sendJson(res, 404, { error: 'User account not found.' });
          }

          // Update password with fresh salt
          const newSalt = crypto.randomBytes(16).toString('hex');
          const newHash = hashPassword(newPassword, newSalt);

          db.users[userIndex].salt = newSalt;
          db.users[userIndex].passwordHash = newHash;
          db.users[userIndex].updatedAt = new Date().toISOString();

          // Mark token as used
          record.used = true;

          // Invalidate all existing sessions for this user across all devices!
          db.sessions = (db.sessions || []).filter((s) => s.userId !== record.userId);

          writeDb(db);

          console.log(`✓ Password updated for user ${db.users[userIndex].email}. All old sessions invalidated.`);

          return sendJson(res, 200, {
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.',
          });
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
          const customerId = body.id || `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          db.customers = db.customers || [];

          const existingIndex = db.customers.findIndex((c) => c.id === customerId && c.userId === user.id);
          if (existingIndex !== -1) {
            db.customers[existingIndex] = {
              ...db.customers[existingIndex],
              ...body,
              id: customerId,
              userId: user.id,
              updatedAt: now,
            };
            writeDb(db);
            return sendJson(res, 200, db.customers[existingIndex]);
          }

          const newCustomer = {
            ...body,
            id: customerId,
            userId: user.id, // Strictly bound to authenticated user
            createdAt: body.createdAt || now,
            updatedAt: now,
          };

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
            // Upsert if record was created locally or seeded
            const upserted = {
              ...body,
              id: customerId,
              userId: user.id,
              createdAt: body.createdAt || now,
              updatedAt: now,
            };
            db.customers.unshift(upserted);
            writeDb(db);
            return sendJson(res, 200, upserted);
          }

          db.customers[index] = {
            ...db.customers[index],
            ...body,
            id: customerId,
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
          const noteId = body.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          db.notes = db.notes || [];

          const existingIndex = db.notes.findIndex((n) => n.id === noteId && n.userId === user.id);
          if (existingIndex !== -1) {
            db.notes[existingIndex] = {
              ...db.notes[existingIndex],
              ...body,
              id: noteId,
              userId: user.id,
              updatedAt: now,
            };
            writeDb(db);
            return sendJson(res, 200, db.notes[existingIndex]);
          }

          const newNote = {
            ...body,
            id: noteId,
            userId: user.id,
            createdAt: body.createdAt || now,
            updatedAt: now,
          };

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
            const upserted = {
              ...body,
              id: noteId,
              userId: user.id,
              createdAt: body.createdAt || now,
              updatedAt: now,
            };
            db.notes.unshift(upserted);
            writeDb(db);
            return sendJson(res, 200, upserted);
          }

          db.notes[index] = {
            ...db.notes[index],
            ...body,
            id: noteId,
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
}

export function cloudApiPlugin() {
  return {
    name: 'cloud-api-plugin',
    configureServer(server) {
      initDb();
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (req.method !== 'OPTIONS' && !url.startsWith('/api/')) {
          return next();
        }
        await handleCloudApi(req, res);
      });
    },
    configurePreviewServer(server) {
      initDb();
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (req.method !== 'OPTIONS' && !url.startsWith('/api/')) {
          return next();
        }
        await handleCloudApi(req, res);
      });
    },
  };
}
