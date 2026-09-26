/**
 * makePdf.mjs — minimal single-page text PDF writer (standard Helvetica).
 * Produces a small, standards-valid PDF with a correct xref table, good enough
 * for native PDF understanding (Gemini) and text extraction (PDF.js).
 */
function escapePdfText(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Build a one-page PDF Buffer from an array of text lines. */
export function makeTextPdf(lines) {
  const leading = 16;
  const top = 780;
  let stream = 'BT\n/F1 11 Tf\n' + `1 0 0 1 56 ${top} Tm\n` + `${leading} TL\n`;
  lines.forEach((line, i) => {
    if (i > 0) stream += 'T*\n';
    stream += `(${escapePdfText(line)}) Tj\n`;
  });
  stream += 'ET';

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}
