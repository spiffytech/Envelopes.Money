const tinydate = require('tinydate').default;

export const durations = {
  total: 0,
  weekly: 7,
  biweekly: 14,
  bimonthly: 15,
  monthly: 30,
  annually: 365,
};

export function formatDate(date: Date) {
  return tinydate('{YYYY}-{MM}-{DD}')(date);
}
