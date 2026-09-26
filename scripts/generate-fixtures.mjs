/** Generate a small real PDF fixture from the demo lease text. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { makeTextPdf } from './makePdf.mjs';

const LINES = [
  'COMMERCIAL LEASE AGREEMENT',
  '',
  '1. RENT. The Tenant shall pay monthly rent of INR 85,000, payable in',
  'advance on or before the 5th day of each calendar month.',
  '2. SECURITY DEPOSIT. The Tenant shall deposit a sum equal to six (6)',
  "months' rent as an interest-free security deposit.",
  '3. LOCK-IN PERIOD. This lease has a lock-in period of eleven (11) months',
  'during which the Tenant may not terminate the lease.',
  '4. TERMINATION. After the lock-in period, either party may terminate this',
  "lease by giving three (3) months' written notice.",
  '5. FORFEITURE. If the Tenant vacates during the lock-in period, the entire',
  'security deposit shall stand forfeited.',
];

mkdirSync('tests/fixtures', { recursive: true });
const pdf = makeTextPdf(LINES);
writeFileSync('tests/fixtures/sample-lease.pdf', pdf);
console.log(`Wrote tests/fixtures/sample-lease.pdf (${pdf.length} bytes)`);
