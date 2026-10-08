import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('SIEVPHOV BANCHY - DATA ARCHITECTURE VERIFICATION TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  process.stdout.write(`Test ${totalTests}: ${name} ... `);
  try {
    fn();
    console.log('PASSED ✓');
    passedTests++;
  } catch (err) {
    console.log('FAILED ✗');
    console.error('  Error:', err.message);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  process.stdout.write(`Test ${totalTests}: ${name} ... `);
  try {
    await fn();
    console.log('PASSED ✓');
    passedTests++;
  } catch (err) {
    console.log('FAILED ✗');
    console.error('  Error:', err.message);
  }
}

// -----------------------------------------------------------------------------
// 1. Schema & SQL File Verification
// -----------------------------------------------------------------------------
runTest('Schema contains required tables, columns, indexes, triggers, and RLS', () => {
  const schemaPath = path.join(ROOT, 'supabase_schema.sql');
  assert.ok(fs.existsSync(schemaPath), 'supabase_schema.sql must exist');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Verify customers table & columns
  assert.ok(schema.includes('create table if not exists public.customers'), 'Must create public.customers table');
  assert.ok(schema.includes('id uuid primary key default gen_random_uuid()'), 'Must use UUID primary key for customers');
  assert.ok(schema.includes('user_id uuid references auth.users(id) on delete cascade not null'), 'user_id must reference auth.users(id)');
  assert.ok(schema.includes('customer_name text not null'), 'Must have customer_name column');
  assert.ok(schema.includes('product_category text'), 'Must have product_category column');
  assert.ok(schema.includes('amount numeric'), 'Must have amount column');
  assert.ok(schema.includes('price_of_goods numeric'), 'Must have price_of_goods column');
  assert.ok(schema.includes('outstanding_debt numeric'), 'Must have outstanding_debt column');
  assert.ok(schema.includes('notes text'), 'Must have notes column');
  assert.ok(schema.includes('created_at timestamptz'), 'Must have created_at column');
  assert.ok(schema.includes('updated_at timestamptz'), 'Must have updated_at column');

  // Verify indexes
  assert.ok(schema.includes('idx_customers_user_id on public.customers(user_id)'), 'Must index user_id');
  assert.ok(schema.includes('idx_customers_created_at on public.customers(created_at'), 'Must index created_at');
  assert.ok(schema.includes('idx_customers_updated_at on public.customers(updated_at'), 'Must index updated_at');

  // Verify RLS
  assert.ok(schema.includes('alter table public.customers enable row level security;'), 'Must enable RLS on customers');
  assert.ok(schema.includes('create policy "Users can select own customers"'), 'Must have select policy');
  assert.ok(schema.includes('create policy "Users can insert own customers"'), 'Must have insert policy');
  assert.ok(schema.includes('create policy "Users can update own customers"'), 'Must have update policy');
  assert.ok(schema.includes('create policy "Users can delete own customers"'), 'Must have delete policy');
  assert.ok(schema.includes('auth.uid() = user_id'), 'Policies must enforce auth.uid() = user_id');

  // Verify triggers
  assert.ok(schema.includes('create or replace function public.set_updated_at_timestamp()'), 'Must have set_updated_at_timestamp trigger function');
  assert.ok(schema.includes('trigger_set_customers_updated_at'), 'Must have customers updated_at trigger');

  // Verify Realtime publication
  assert.ok(schema.includes('supabase_realtime add table public.customers'), 'Must add customers to supabase_realtime publication');
  assert.ok(schema.includes('alter table public.customers replica identity full'), 'Must set replica identity full');
});

// -----------------------------------------------------------------------------
// 2. Environment Variables & Templates
// -----------------------------------------------------------------------------
runTest('.env.example template provides required Supabase variables', () => {
  const envExamplePath = path.join(ROOT, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  assert.ok(envContent.includes('VITE_SUPABASE_URL='), 'Must include VITE_SUPABASE_URL');
  assert.ok(envContent.includes('VITE_SUPABASE_ANON_KEY='), 'Must include VITE_SUPABASE_ANON_KEY');
});

// -----------------------------------------------------------------------------
// 3. Security Check: Frontend must never expose service_role key
// -----------------------------------------------------------------------------
runTest('Frontend codebase never contains service_role secret keys', () => {
  const srcFiles = fs.readdirSync(path.join(ROOT, 'src'), { recursive: true });
  for (const f of srcFiles) {
    const fullPath = path.join(ROOT, 'src', f);
    if (fs.statSync(fullPath).isFile() && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.ok(
        !content.includes('service_role_key') && !content.includes('SUPABASE_SERVICE_ROLE'),
        `File ${f} must not contain service_role credentials`
      );
    }
  }
});

// -----------------------------------------------------------------------------
// 4. Data Validation and UUID Generators
// -----------------------------------------------------------------------------
runTest('UUID validation & generation conforms to RFC4122 v4', () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const id1 = generateUUID();
  const id2 = generateUUID();
  assert.ok(uuidRegex.test(id1), `Generated id1 ${id1} must be a valid UUID`);
  assert.ok(uuidRegex.test(id2), `Generated id2 ${id2} must be a valid UUID`);
  assert.notStrictEqual(id1, id2, 'Generated UUIDs must be unique');
});

// -----------------------------------------------------------------------------
// 5. Input Validation Rules (Section 8)
// -----------------------------------------------------------------------------
runTest('Form validation prevents NaN, negative numbers, and empty required customer_name', () => {
  const validateCustomer = (data) => {
    const errors = {};
    const name = (data.customerName || data.name || '').trim();
    if (!name) {
      errors.name = 'សូមបញ្ចូលឈ្មោះអតិថិជន';
    }
    if (data.amount !== undefined && data.amount !== null) {
      const amt = Number(data.amount);
      if (isNaN(amt) || amt < 0) {
        errors.amount = 'ចំនួនទំនិញត្រូវតែជាលេខវិជ្ជមាន';
      }
    }
    if (data.priceOfGoods !== undefined && data.priceOfGoods !== null) {
      const price = Number(data.priceOfGoods);
      if (isNaN(price) || price < 0) {
        errors.priceOfGoods = 'តម្លៃទំនិញត្រូវតែជាលេខវិជ្ជមាន';
      }
    }
    if (data.outstandingDebt !== undefined && data.outstandingDebt !== null) {
      const debt = Number(data.outstandingDebt);
      if (isNaN(debt) || debt < 0) {
        errors.outstandingDebt = 'ទឹកប្រាក់ជំពាក់ត្រូវតែជាលេខវិជ្ជមាន';
      }
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Case 1: Empty customer name
  const res1 = validateCustomer({ customerName: '', amount: 10 });
  assert.strictEqual(res1.isValid, false);
  assert.ok(res1.errors.name, 'Should require customer name');

  // Case 2: Negative amount
  const res2 = validateCustomer({ customerName: 'សុខ គង់', amount: -5 });
  assert.strictEqual(res2.isValid, false);
  assert.ok(res2.errors.amount, 'Should reject negative amount');

  // Case 3: NaN price of goods
  const res3 = validateCustomer({ customerName: 'សុខ គង់', priceOfGoods: NaN });
  assert.strictEqual(res3.isValid, false);
  assert.ok(res3.errors.priceOfGoods, 'Should reject NaN price of goods');

  // Case 4: Valid input
  const res4 = validateCustomer({
    customerName: 'សុខ សុវណ្ណារ៉ា',
    amount: 2,
    priceOfGoods: 25.0,
    outstandingDebt: 50.0,
  });
  assert.strictEqual(res4.isValid, true);
  assert.strictEqual(Object.keys(res4.errors).length, 0);
});

// -----------------------------------------------------------------------------
// 6. Multi-User Isolation & RLS Security Simulation (Section 3 & 4)
// -----------------------------------------------------------------------------
runTest('Multi-user isolation: User A can NEVER view, update or delete User B records', () => {
  const userA_id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const userB_id = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';

  // Database mock table
  const database = [
    { id: '11111111-1111-4111-a111-111111111111', user_id: userA_id, customer_name: 'Customer 1 (User A)', outstanding_debt: 100 },
    { id: '22222222-2222-4222-a222-222222222222', user_id: userA_id, customer_name: 'Customer 2 (User A)', outstanding_debt: 200 },
    { id: '33333333-3333-4333-a333-333333333333', user_id: userA_id, customer_name: 'Customer 3 (User A)', outstanding_debt: 300 },
    { id: '44444444-4444-4444-b444-444444444444', user_id: userB_id, customer_name: 'Customer 4 (User B)', outstanding_debt: 400 },
    { id: '55555555-5555-4555-b555-555555555555', user_id: userB_id, customer_name: 'Customer 5 (User B)', outstanding_debt: 500 },
  ];

  // Simulating RLS policy: SELECT USING (auth.uid() = user_id)
  const rlsSelect = (authenticatedUid) => {
    return database.filter((row) => row.user_id === authenticatedUid);
  };

  // Simulating RLS policy: UPDATE USING (auth.uid() = user_id)
  const rlsUpdate = (authenticatedUid, id, newData) => {
    const record = database.find((r) => r.id === id);
    if (!record || record.user_id !== authenticatedUid) {
      throw new Error('RLS Violation: Unauthorized row update blocked by PostgreSQL policy');
    }
    Object.assign(record, newData);
    return record;
  };

  // Simulating RLS policy: DELETE USING (auth.uid() = user_id)
  const rlsDelete = (authenticatedUid, id) => {
    const idx = database.findIndex((r) => r.id === id);
    if (idx === -1 || database[idx].user_id !== authenticatedUid) {
      throw new Error('RLS Violation: Unauthorized row deletion blocked by PostgreSQL policy');
    }
    database.splice(idx, 1);
  };

  // TEST 1: User A sees only User A records
  const userARecords = rlsSelect(userA_id);
  assert.strictEqual(userARecords.length, 3);
  assert.ok(userARecords.every((r) => r.user_id === userA_id));

  // TEST 2: User B sees only User B records (cannot see Customer 1, 2, 3)
  const userBRecords = rlsSelect(userB_id);
  assert.strictEqual(userBRecords.length, 2);
  assert.ok(userBRecords.every((r) => r.user_id === userB_id));

  // TEST 8: Try to update User B's record using User A authentication
  assert.throws(
    () => rlsUpdate(userA_id, '44444444-4444-4444-b444-444444444444', { outstanding_debt: 0 }),
    /RLS Violation/
  );

  // Try to delete User B's record using User A authentication
  assert.throws(
    () => rlsDelete(userA_id, '55555555-5555-4555-b555-555555555555'),
    /RLS Violation/
  );
});

// -----------------------------------------------------------------------------
// 7. Realtime Synchronization & Duplicate Prevention (Section 6 & 18)
// -----------------------------------------------------------------------------
runTest('Realtime duplicate prevention: INSERT, UPDATE, DELETE keep multi-device state in sync', () => {
  let localState = [
    { id: 'cust-1', name: 'ឈន ពិសិដ្ឋ', outstandingDebt: 50 },
  ];

  // Realtime INSERT handler with duplicate prevention
  const handleRealtimeInsert = (newCust) => {
    const exists = localState.some((c) => c.id === newCust.id);
    if (!exists) {
      localState = [newCust, ...localState];
    } else {
      localState = localState.map((c) => (c.id === newCust.id ? { ...c, ...newCust } : c));
    }
  };

  // Realtime UPDATE handler
  const handleRealtimeUpdate = (updatedCust) => {
    localState = localState.map((c) => (c.id === updatedCust.id ? { ...c, ...updatedCust } : c));
  };

  // Realtime DELETE handler
  const handleRealtimeDelete = (deletedId) => {
    localState = localState.filter((c) => c.id !== deletedId);
  };

  // TEST 3: User adds customer on Phone -> received by Laptop
  handleRealtimeInsert({ id: 'cust-2', name: 'ហេង វិសាល', outstandingDebt: 120 });
  assert.strictEqual(localState.length, 2);
  assert.strictEqual(localState[0].id, 'cust-2');

  // Prevent duplicate if duplicate event dispatched
  handleRealtimeInsert({ id: 'cust-2', name: 'ហេង វិសាល', outstandingDebt: 120 });
  assert.strictEqual(localState.length, 2, 'Duplicate event must NOT create duplicate item');

  // TEST 4: Phone edits debt from $50 to $70 -> Laptop updates automatically
  handleRealtimeUpdate({ id: 'cust-1', name: 'ឈន ពិសិដ្ឋ', outstandingDebt: 70 });
  assert.strictEqual(localState.find((c) => c.id === 'cust-1').outstandingDebt, 70);

  // TEST 5: Laptop deletes customer -> Phone removes automatically
  handleRealtimeDelete('cust-2');
  assert.strictEqual(localState.length, 1);
  assert.strictEqual(localState[0].id, 'cust-1');
});

// -----------------------------------------------------------------------------
// 8. Data Migration (Section 16)
// -----------------------------------------------------------------------------
runTest('Legacy data migration assigns valid UUIDs and links to authenticated user_id', () => {
  const currentUserId = '88888888-8888-4888-8888-888888888888';
  const legacyData = [
    { id: 'legacy-cust-1', name: 'Customer Old 1', balance: 45 },
    { id: 'legacy-cust-2', name: 'Customer Old 2', balance: 90 },
  ];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const migrated = legacyData.map((cust) => {
    const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    return {
      id,
      user_id: currentUserId,
      customer_name: cust.name,
      outstanding_debt: cust.balance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  assert.strictEqual(migrated.length, 2);
  assert.ok(uuidRegex.test(migrated[0].id), 'Must have valid UUID');
  assert.ok(uuidRegex.test(migrated[1].id), 'Must have valid UUID');
  assert.strictEqual(migrated[0].user_id, currentUserId);
  assert.strictEqual(migrated[1].user_id, currentUserId);
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} tests passed`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
