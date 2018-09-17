export default class Amount {
  public static Pennies(p: number) {
    return new Amount(p);
  }

  public static Dollars(d: number) {
    const amt = new Amount(0);
    amt.dollars = d;
    return amt;
  }

  protected _human: string | null = null;

  protected constructor(public pennies: number) {
    if (pennies === null || pennies === undefined) throw new Error('Amount was initialized with no value');
  }

  get dollars() {
    return this.pennies / 100;
  }

  set dollars(d: number) {
    this.pennies = d * 100;
  }

  get human() {
    return this._human || this.dollars.toFixed(2);
  }

  set human(h: string) {
    this._human = h;
    this.pennies = Math.round(Number.parseFloat(h) * 100);
  }
}
