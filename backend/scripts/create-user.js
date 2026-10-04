/**
 * Creates or updates an account from the command line. This is how the first
 * admin gets in — the admin console can only manage client accounts.
 *
 *   npm run admin:add -- 9876543210 "Amit More" amit.more@dobbyads.com
 *   npm run user:add  -- 9876543210 "Client Name"
 *
 * Re-running with the same number updates the name/email and re-enables the
 * account instead of failing. `admin:add` promotes an existing client.
 */
import { connectDb, disconnectDb } from '../config/db.js';
import { ROLES, User } from '../models/user.model.js';
import { normalizePhone10 } from '../utils/phone.js';

const args = process.argv.slice(2);
const asAdmin = args.includes('--admin');
const [rawPhone, name = '', email = ''] = args.filter((arg) => !arg.startsWith('--'));

const phone = normalizePhone10(rawPhone);
if (!phone) {
  console.error('Usage: npm run user:add|admin:add -- <10-digit-phone> [name] [email]');
  process.exit(1);
}

await connectDb();

const user = await User.findOneAndUpdate(
  { phone },
  {
    $set: {
      ...(name && { name }),
      ...(email && { email }),
      ...(asAdmin && { role: ROLES.ADMIN }),
      isActive: true,
    },
  },
  { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
);

console.log(`[user] ready: ${user.name || '(no name)'} — ${user.phone} (${user.role})`);

await disconnectDb();
