export default class Amount {
  public static Pennies(p: number) {
    return new Amount(p);
  }

  public static Dollars(d: number) {
    const amt = new Amount(0);
    amt.dollars = d;
    return amt;
  }

  protected constructor(public pennies: number) {}

  get dollars() {
    return this.pennies / 100;
  }

  set dollars(d: number) {
    this.pennies = d * 100;
  }
}
