// Manual one-shot backfill. Normal upgrades run this automatically via
// runStartupTasks() in index.ts; this script is a manual fallback for
// admins who need to force a re-run without bouncing the server.
//   npx ts-node src/scripts/backfillPhaseTargets.ts

import 'dotenv/config';
import { prisma } from '../database';
import { runStartupTasks } from '../utils/startupTasks';

(async () => {
  await prisma.$connect();
  await runStartupTasks();
  await prisma.$disconnect();
})().catch(async (err) => {
  console.error('🔴 [Backfill] Failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
