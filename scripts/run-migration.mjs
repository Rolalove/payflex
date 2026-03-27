/**
 * Run the split bill payment fix migration via Supabase Management API.
 * 
 * Usage: node scripts/run-migration.mjs <SUPABASE_DB_PASSWORD>
 * 
 * If you don't have the DB password, paste the SQL from
 * supabase/migrations/20260326020000_fix_split_bill_payment.sql
 * into the Supabase SQL Editor at:
 * https://supabase.com/dashboard/project/qhybvveroxskiiyprxoy/sql
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20260326020000_fix_split_bill_payment.sql');

const SUPABASE_URL = 'https://qhybvveroxskiiyprxoy.supabase.co';

// Try to get service role key from env or args
const SERVICE_ROLE_KEY = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ Missing service role key.');
  console.error('\nUsage: node scripts/run-migration.mjs <SUPABASE_SERVICE_ROLE_KEY>');
  console.error('\nYou can find it at:');
  console.error('https://supabase.com/dashboard/project/qhybvveroxskiiyprxoy/settings/api');
  console.error('\nOr paste the SQL manually at:');
  console.error('https://supabase.com/dashboard/project/qhybvveroxskiiyprxoy/sql/new');
  process.exit(1);
}

const sql = readFileSync(sqlPath, 'utf-8');
console.log('📄 Running migration: 20260326020000_fix_split_bill_payment.sql');
console.log('─'.repeat(50));

// Use Supabase's pg_net or rpc approach — execute raw SQL via PostgREST rpc
// Actually, the simplest way is via the management API
const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
  method: 'POST',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify({})
});

// PostgREST doesn't support raw SQL. Let's use the SQL endpoint instead.
// The Supabase SQL API endpoint:
const sqlRes = await fetch(`${SUPABASE_URL}/pg`, {
  method: 'POST', 
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql })
});

if (sqlRes.ok) {
  console.log('✅ Migration applied successfully!');
} else {
  const err = await sqlRes.text();
  console.error('❌ Migration failed:', sqlRes.status, err);
  console.error('\n💡 Alternative: paste the SQL manually at:');
  console.error('https://supabase.com/dashboard/project/qhybvveroxskiiyprxoy/sql/new');
}
