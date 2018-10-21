export interface IGoodBudgetRow {
  Date: string;
  Envelope: string;
  Account: string;
  Name: string;
  Amount: string;
  Notes: string;
  Status: string;
  Details: string;
}

export interface IGoodBudgetTxfr extends IGoodBudgetRow {
  txfrId: string;
}
