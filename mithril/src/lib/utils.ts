export const durations = {
  total: 0,
  weekly: 7,
  biweekly: 14,
  bimonthly: 15,
  monthly: 30,
  annually: 365,
};

export function formatDate(date: string | Date) {
  if (typeof date === 'string') date = new Date(date + 'T00:00');
  return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}
