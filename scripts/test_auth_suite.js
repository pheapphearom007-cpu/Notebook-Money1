import http from 'http';
import { handleCloudApi } from './serverApiPlugin.js';

const PORT = 3199;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Create test server
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/') || req.method === 'OPTIONS') {
    return handleCloudApi(req, res);
  }
  res.statusCode = 404;
  res.end('Not found');
});

async function api(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {}

  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`\n======================================================`);
  console.log(`RUNNING PRODUCTION AUTHENTICATION & MULTI-DEVICE TEST SUITE`);
  console.log(`======================================================\n`);

  let passed = 0;
  const total = 9;

  const testUser = {
    name: 'Sok Mean',
    email: `test_multidevice_${Date.now()}@domain.com`,
    password: 'InitialPassword123!',
    newPassword: 'BrandNewSecurePassword456!',
  };

  let deviceAToken = null;
  let deviceBToken = null;
  let resetToken = null;

  try {
    // TEST 1: Device A -> Register account -> Login successfully
    console.log('TEST 1: Device A -> Register account -> Login successfully...');
    const regRes = await api('/api/auth/register', 'POST', {
      name: testUser.name,
      email: testUser.email,
      password: testUser.password,
    });

    if (regRes.status === 201 && regRes.data.user && regRes.data.token) {
      // Test login as Device A
      const loginA = await api('/api/auth/login', 'POST', {
        email: testUser.email,
        password: testUser.password,
      });

      if (loginA.status === 200 && loginA.data.token) {
        deviceAToken = loginA.data.token;
        console.log('  ✓ TEST 1 PASSED: Device A registered & logged in successfully.\n');
        passed++;
      } else {
        throw new Error(`Device A login failed: ${JSON.stringify(loginA)}`);
      }
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(regRes)}`);
    }

    // TEST 2: Device B -> Use exact same email and password -> Login successfully
    console.log('TEST 2: Device B -> Use exact same email and password -> Login successfully...');
    const loginB = await api('/api/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.password,
    });

    if (loginB.status === 200 && loginB.data.token && loginB.data.user.email === testUser.email.toLowerCase()) {
      deviceBToken = loginB.data.token;
      console.log('  ✓ TEST 2 PASSED: Device B authenticated against same central database account.\n');
      passed++;
    } else {
      throw new Error(`Device B login failed: ${JSON.stringify(loginB)}`);
    }

    // TEST 3: Device A -> Logout -> Login again -> Successful
    console.log('TEST 3: Device A -> Logout -> Login again -> Successful...');
    const logoutA = await api('/api/auth/logout', 'POST', {}, deviceAToken);
    if (logoutA.status === 200) {
      // Verify me fails with old token
      const checkA = await api('/api/auth/me', 'GET', null, deviceAToken);
      if (checkA.status === 401) {
        // Re-login
        const reloginA = await api('/api/auth/login', 'POST', {
          email: testUser.email,
          password: testUser.password,
        });
        if (reloginA.status === 200) {
          deviceAToken = reloginA.data.token;
          console.log('  ✓ TEST 3 PASSED: Device A logged out and re-authenticated successfully.\n');
          passed++;
        } else {
          throw new Error('Device A re-login failed');
        }
      } else {
        throw new Error('Device A token was not invalidated on logout');
      }
    } else {
      throw new Error('Device A logout failed');
    }

    // TEST 4: Device B -> Logout -> Login again -> Successful
    console.log('TEST 4: Device B -> Logout -> Login again -> Successful...');
    const logoutB = await api('/api/auth/logout', 'POST', {}, deviceBToken);
    if (logoutB.status === 200) {
      const reloginB = await api('/api/auth/login', 'POST', {
        email: testUser.email,
        password: testUser.password,
      });
      if (reloginB.status === 200) {
        deviceBToken = reloginB.data.token;
        console.log('  ✓ TEST 4 PASSED: Device B logged out and re-authenticated successfully.\n');
        passed++;
      } else {
        throw new Error('Device B re-login failed');
      }
    } else {
      throw new Error('Device B logout failed');
    }

    // TEST 5: Device A -> Forgot Password -> Request reset link -> Email/link works
    console.log('TEST 5: Device A -> Forgot Password -> Request reset link -> Valid token generated...');
    const forgotRes = await api('/api/auth/forgot-password', 'POST', {
      email: testUser.email,
    });

    if (forgotRes.status === 200 && forgotRes.data.success) {
      // Extract dev token from devResetUrl or verify token in db
      if (forgotRes.data.devResetUrl) {
        const u = new URL(forgotRes.data.devResetUrl);
        resetToken = u.searchParams.get('token');
      }

      if (!resetToken) {
        throw new Error('No reset token generated');
      }

      // Verify token
      const verifyRes = await api(`/api/auth/verify-reset-token?token=${resetToken}`, 'GET');
      if (verifyRes.status === 200 && verifyRes.data.valid) {
        console.log(`  ✓ TEST 5 PASSED: Password reset token created and validated: ${resetToken.substring(0, 10)}...\n`);
        passed++;
      } else {
        throw new Error(`Token verification failed: ${JSON.stringify(verifyRes)}`);
      }
    } else {
      throw new Error(`Forgot password request failed: ${JSON.stringify(forgotRes)}`);
    }

    // TEST 6: Open reset link -> Create new password -> Password update succeeds
    console.log('TEST 6: Open reset link -> Create new password -> Password update succeeds...');
    const updateRes = await api('/api/auth/reset-password', 'POST', {
      token: resetToken,
      newPassword: testUser.newPassword,
    });

    if (updateRes.status === 200 && updateRes.data.success) {
      console.log('  ✓ TEST 6 PASSED: Password successfully updated on server.\n');
      passed++;
    } else {
      throw new Error(`Password reset failed: ${JSON.stringify(updateRes)}`);
    }

    // TEST 7: Device B -> Login using the NEW password -> Successful
    console.log('TEST 7: Device B -> Login using NEW password -> Successful...');
    const loginBNew = await api('/api/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.newPassword,
    });

    if (loginBNew.status === 200 && loginBNew.data.token) {
      console.log('  ✓ TEST 7 PASSED: Device B successfully logged in with the NEW password.\n');
      passed++;
    } else {
      throw new Error(`Device B login with new password failed: ${JSON.stringify(loginBNew)}`);
    }

    // TEST 8: Old password -> Login should fail after password change
    console.log('TEST 8: Old password -> Login should fail after password change...');
    const loginBOld = await api('/api/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.password,
    });

    if (loginBOld.status === 401) {
      console.log('  ✓ TEST 8 PASSED: Old password was rejected as invalid.\n');
      passed++;
    } else {
      throw new Error(`Old password unexpectedly succeeded: ${JSON.stringify(loginBOld)}`);
    }

    // TEST 9: Use an expired/invalid reset token -> Reset should be rejected securely
    console.log('TEST 9: Re-using token or using invalid token -> Rejected securely...');
    const reuseRes = await api('/api/auth/reset-password', 'POST', {
      token: resetToken,
      newPassword: 'YetAnotherPassword999!',
    });

    const fakeTokenRes = await api('/api/auth/reset-password', 'POST', {
      token: 'fake_invalid_token_1234567890',
      newPassword: 'YetAnotherPassword999!',
    });

    if (reuseRes.status === 400 && fakeTokenRes.status === 400) {
      console.log('  ✓ TEST 9 PASSED: Single-use token enforcement & invalid token rejection verified.\n');
      passed++;
    } else {
      throw new Error('Token reuse was not rejected');
    }

    console.log(`======================================================`);
    console.log(`TEST RESULTS: ${passed} / ${total} TESTS PASSED (100% SUCCESS)`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('✗ TEST FAILED:', err.message);
  } finally {
    server.close();
  }
}

runTests();
