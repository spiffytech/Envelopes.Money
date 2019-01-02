export function toDollars(pennies: number): string {
  return (pennies / 100).toFixed(2);
}
