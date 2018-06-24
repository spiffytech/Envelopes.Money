export function formatCurrency(amount: number): string {
  return Intl.NumberFormat(                                                                                                                                                                                                 
    navigator.language || 'en-US',                                                                                                                                                                                          
    {style: 'currency', currency: 'USD'}                                                                                                                                                                                    
  ).format(amount / 100);
}