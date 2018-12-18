import * as CommonTypes from '../../../common/lib/types';

export function sumAmounts(parts: CommonTypes.ITransactionPart[]): number {
  return parts.map((part) => part.amount).reduce((a, b) => a + b, 0);
}
