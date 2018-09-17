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

describe('Human strings', () => {
  it('Returns a human representation of the initialized value', () => {
    const amount = Amount.Pennies(5);
    expect(amount.human).toBe('0.05');
  });

  it('Sets the human amount', () => {
    const amount = Amount.Dollars(5);
    amount.human = '6.23';
    expect(amount.human).toBe('6.23');
  });

  it('Changes the value when the human amount changes', () => {
    const amount = Amount.Dollars(5);
    amount.human = '6.23';
    expect(amount.pennies).toBe(623);
  });

  it('Rounds human values to the nearest penny', () => {
    const amount = Amount.Dollars(5);
    amount.human = '6.4567';
    expect(amount.pennies).toBe(646);
  });
});

describe('Validation', () => {
  it('Throws an error if no value is passed in', () => {
    expect(() => Amount.Pennies(undefined as any as number)).toThrow();
  });
});
