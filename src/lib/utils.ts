export function formatCurrency(dollars: number): string {
  return Intl.NumberFormat(                                                                                                                                                                                                 
    navigator.language || 'en-US',                                                                                                                                                                                          
    {style: 'currency', currency: 'USD'}                                                                                                                                                                                    
  ).format(dollars);
}