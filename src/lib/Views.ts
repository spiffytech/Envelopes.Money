import * as Txns from './txns';

export interface Home {
  name: 'home';
}

export interface Login {
  name: 'login';
}

export interface EditTxn {
  name: 'editTxn';
  txn: Txns.Txn;
}

export type All = Home | Login | EditTxn;
