export interface GoodBudgetRow {
  Date: string;
  Envelope: string;
  Account: string;
  Name: string;
  Amount: string;
  Notes: string;
  Status: string;
  Details: string;
}

export interface GoodBudgetTxfr extends GoodBudgetRow {
  txfrId: string;
}