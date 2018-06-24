// These are in here because putting them inside Txns means the Firebase
// functions tsc can't import them, since the txns module uses es2017 features
export interface TxnItem {
  account: string;
  amount: number;
}

export interface DETxn {
  id: string;
  payee: string;
  date: Date;
  items: {[key: string]: number};
  memo: string;
}


export interface Account {
  name: string;
  balance: number;
  isBankAccount?: boolean;
}