import * as Txns from './txns';

export function formatCurrency(dollars: Txns.Dollars): string {
  return Intl.NumberFormat(
    navigator.language || 'en-US',
    {style: 'currency', currency: 'USD'},
  ).format(dollars);
}
