export function toDollars(pennies: number): string {
  return (
    (pennies / 100).
    toLocaleString([], {minimumFractionDigits: 2, maximumFractionDigits: 2})
  );
}
