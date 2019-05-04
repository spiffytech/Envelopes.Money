export function toDollars(pennies) {
  return (
    (pennies / 100).
    toLocaleString([], {minimumFractionDigits: 2, maximumFractionDigits: 2})
  );
}
