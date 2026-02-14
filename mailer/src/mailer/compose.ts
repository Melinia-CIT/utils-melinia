export function composeEmail(from: string, to: string, subject: string, html: string) {
  return {
    from,
    to,
    subject,
    html
  };
}
