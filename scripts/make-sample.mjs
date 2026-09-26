/** Generate a realistic sample Indian commercial lease PDF into public/. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { makeTextPdf } from './makePdf.mjs';

const LINES = [
  'COMMERCIAL LEASE AGREEMENT',
  '',
  'This Lease is made at Bengaluru between the Lessor and the Lessee.',
  '',
  '1. RENT. The Lessee shall pay monthly rent of INR 1,20,000, payable in',
  'advance on or before the 5th day of each calendar month.',
  '',
  '2. SECURITY DEPOSIT. The Lessee shall deposit a sum equal to six (6)',
  "months' rent as an interest-free security deposit.",
  '',
  '3. LOCK-IN PERIOD. This Lease has a lock-in period of eleven (11) months',
  'during which the Lessee may not terminate the Lease.',
  '',
  '4. ESCALATION. The rent shall escalate by ten percent (10%) at the end of',
  'every twelve (12) month period.',
  '',
  '5. MAINTENANCE. The Lessee shall bear all charges for routine maintenance,',
  'minor repairs, water and electricity.',
  '',
  '6. TERMINATION. After the lock-in period, either party may terminate this',
  "Lease by giving three (3) months' written notice.",
  '',
  '7. FORFEITURE. If the Lessee vacates during the lock-in period, the entire',
  'security deposit shall stand forfeited as liquidated damages.',
  '',
  '8. DATA. The Lessor may process the personal data of the Lessee for billing',
  'and verification in accordance with its privacy policy.',
  '',
  '9. DISPUTE RESOLUTION. Any dispute shall be referred to a sole arbitrator',
  'and the seat of arbitration shall be Bengaluru.',
  '',
  '10. JURISDICTION. This Agreement shall be governed by the laws of India and',
  'subject to the jurisdiction of the courts at Bengaluru.',
];

mkdirSync('public', { recursive: true });
const pdf = makeTextPdf(LINES);
writeFileSync('public/sample-lease.pdf', pdf);
console.log(`Wrote public/sample-lease.pdf (${pdf.length} bytes)`);
