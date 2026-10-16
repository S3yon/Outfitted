// Prices are free text from Google Shopping ("$1,299.00", "CA$45"). Read the first number.
export function parsePrice(text: string | null | undefined): number | null {
  const match = text?.replace(/,/g, "").match(/\d+(\.\d+)?/);
  if (!match) return null;
  const cents = Math.round(parseFloat(match[0]) * 100);
  return cents > 0 ? cents : null;
}

export function formatCents(cents: number): string {
  const whole = cents % 100 === 0;
  return (
    "$" +
    (cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    })
  );
}
