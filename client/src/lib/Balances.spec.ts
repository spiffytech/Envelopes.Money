export default undefined

import * as Balances from './Balances';
import Balance from '../components/Balance';

const emptyEnvelope: Balances.BalanceEnvelope = {
  id: '',
  user_id: '',
  name: '',
  type: 'envelope',
  extra: { due: null, target: 0, interval: 'total' },
  tags: {},
  balance: 0,
};

describe('multiplierWithDueDate', () => {
  it('returns multipliers that sum the target balance', () => {
    const target = 100;
    const fillDays = 14;
    const dueDays = 45;
    const fill1 = target * Balances.multiplierWithDueDate(fillDays, dueDays);
    const fill2 = (target-fill1) * Balances.multiplierWithDueDate(fillDays, dueDays - fillDays);
    const fill3 = (target-fill1-fill2) * Balances.multiplierWithDueDate(fillDays, dueDays - fillDays * 2);

    expect(Math.abs(target - (fill1+fill2+fill3))).toBeLessThan(.01);
  });

  it('multiplies out to the same amount every time', () => {
    const target = 100;
    const fillDays = 14;
    const dueDays = 45;
    const fill1 = target * Balances.multiplierWithDueDate(fillDays, dueDays);
    const fill2 = (target-fill1) * Balances.multiplierWithDueDate(fillDays, dueDays - fillDays);
    const fill3 = (target-fill1-fill2) * Balances.multiplierWithDueDate(fillDays, dueDays - fillDays * 2);

    expect(Math.abs(fill1-fill2)).toBeLessThanOrEqual(.01);
    expect(Math.abs(fill1-fill3)).toBeLessThanOrEqual(.01);
  });

  it('returns 1 day if the due date is in the past', () => {
    expect(Balances.multiplierWithDueDate(14, -1)).toBe(1);
  });
});

describe('calcRemainingBalance', () => {
  it('Never returns a negative number', () => {
    const actual = Balances.calcRemainingBalance({balance: 30, extra: {target: 15}});
    expect(actual).toBe(0);
  });
});

describe('calcAmountRegularInterval', () => {
  it('returns 0 if the envelope has a Total target with no due date', () => {
    const actual =
      Balances.calcAmountRegularInterval(
        {...emptyEnvelope, extra: {...emptyEnvelope.extra, interval: 'total', target: 5}}
      )
      expect(actual['total']).toBe(0);
      expect(actual['monthly']).toBe(0);
  });

});
