export function toDollars(pennies: number) {
  return (
    (pennies / 100).
    toLocaleString([], {minimumFractionDigits: 2, maximumFractionDigits: 2})
  );
}
