import Amount from '../Amount';

describe('It handles pennies', () => {
  it('Returns the constructed number of pennies', () => {
    const amount = Amount.Pennies(5);
    expect(amount.pennies).toBe(5);
  });

  it('Returns the set number of pennies', () => {
    const amount = Amount.Pennies(5);
    amount.pennies = 6;
    expect(amount.pennies).toBe(6);
  });

  it('Converts pennies to dollars', () => {
    const amount = Amount.Pennies(5);
    expect(amount.dollars).toBe(.05);
  });
});

describe('It handles dollars', () => {
  it('Sets the number of dollars correctly', () => {
    const amount = Amount.Dollars(5);
    expect(amount.dollars).toBe(5);
  });

  it('Changes the number of dollars correctly', () => {
    const amount = Amount.Dollars(5);
    amount.dollars = 6;
    expect(amount.dollars).toBe(6);
  });

  it('Converts dollars to pennies', () => {
    const amount = Amount.Dollars(5);
    expect(amount.pennies).toBe(500);
  });
});
