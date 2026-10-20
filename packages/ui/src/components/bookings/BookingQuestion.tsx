/**
 * The question of a booking as the mentee wrote it (spec E02, Q5): plain text in the body typeface with
 * the line breaks kept – no Markdown, no code blocks. Long words and URLs wrap instead of widening the
 * page. Only that mentee and that mentor ever see it, so it never goes in a title or a log.
 */
export function BookingQuestion({ question }: { question: string }) {
  return <p className="max-w-prose whitespace-pre-line break-words type-body">{question}</p>;
}
