/** Non-dismissible informational-only disclaimer. Required on every screen. */
export function LegalDisclaimer({ text }: { text?: string }) {
  return (
    <p className="disclaimer" role="note">
      <strong>Informational only — not legal advice.</strong>{' '}
      {text ??
        'Disha helps you read and understand a document. Always consult a qualified legal professional before acting.'}
    </p>
  );
}
