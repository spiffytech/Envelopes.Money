import {GoodBudgetRow, GoodBudgetTxfr} from '../types';
import * as import_ from '../import';
import {isTxn, BankEvent, sumAccountTotal} from '../../lib/txns';
import {groupBy} from '../../lib/utils';

function mkRow(args: Partial<GoodBudgetRow>) {
  return {
      Date: '2018-01-01',
      Envelope: '',
      Account: '',
      Name: '',
      Amount: '2,345.00',
      Notes: '',
      Status: '',
      Details: '',
    ...args,
  }
}

describe('It categorizes things correctly', () => {
  test('It categorizes account transfers when not explicitly marked as such', () => {
    const row: GoodBudgetRow = mkRow({
      Account: 'Betterment',
      Notes: 'Company stock sale'
    });

    expect(import_.typeForRow(row)).toEqual('accountTransfer');
  });

  test('It categorizes account transfers when not explicitly marked as such', () => {
    const row: GoodBudgetTxfr = {
      "Date":"04/22/2018",
      "Envelope":"",
      "Account":"Checking",
      "Name":"Betterment",
      "Notes":"Company stock sale",
      "Amount":"1,000.00",
      "Status":"",
      "Details":"",
      "txfrId": "S1Hl8nRzb7"
    }

    expect(import_.typeForRow(row)).toEqual('accountTransfer');
  });

  test('It categorizes initial balances as transactions', () => {
    const row: GoodBudgetRow = mkRow({
      Account: 'Betterment',
      Notes: 'Company stock sale',
      Envelope: '[Unallocated]'
    });

    expect(import_.typeForRow(row)).toEqual('transaction');
  });

  test('It recognizes a normal transaction', () => {
    const row: GoodBudgetRow = mkRow({
      Date: '06/16/2018',
      Envelope: 'Groceries',
      Account: 'Checking',
      Name: 'Food Lion',
      Notes: '',
      Amount: '-2.29',
      Status: '',
      Details: '' 
    });

    expect(import_.typeForRow(row)).toEqual('transaction');
  });
});

describe('Parsing categories', () => {
  test('It converts single categories to numbers', () => {
      const row = mkRow({
        Date: '12/06/2017',
        Envelope: 'Groceries',
        Account: 'Checking',
        Name: 'Food Lion',
        Notes: '',
        Amount: '-30.80',
        Status: '',
        Details: ''
      });

      const txn = import_.rowToTxn(row);
      if (!txn) throw new Error('txn was null');
      if (!isTxn(txn)) throw new Error('txn was not a Txn');
      expect(txn.categories['Groceries']).toEqual(-3080);
  });

  test('It categorizes this random transaction', () => {
    const row: GoodBudgetRow = {
      Date: '06/07/2018',
      Envelope: 'Car stuff',
      Account: 'AmEx',
      Name: 'NCDMV',
      Notes: 'License(Lacey)',
      Amount: '-13.00',
      Status: '',
      Details: ''
    }

    const txn = import_.rowToTxn(row);
    if (!txn) throw new Error('Txn was not present');
    if (!isTxn(txn)) throw new Error('Was not a transaction');
    expect(txn.categories['Car stuff']).toEqual(-1300);
  });
});

describe('It sums up these transactions correctly', () => {
  const rows = require('./fixture_1.json');
  let txns: BankEvent[] = rows.map(import_.rowToTxn).filter((txn: any) => txn);
  txns = txns.filter((txn) => txn !== null);
  const txnsForChecking = txns.filter((txn) => txn.account === 'Checking');

  test('It gives all rows the right account', () => {
    expect(sumAccountTotal(txnsForChecking)).toEqual(19099);
  });

  test('It has the right number of transactions', () => {
    expect(txnsForChecking.length).toEqual(28);
  });

  test('Calculating group totals is correct', () => {
    const groups = groupBy(txns.filter((txn) => txn.account), ((txn) => txn.account));
    console.log(Object.values(groups).map(sumAccountTotal).map((n) => n / 100))
  });
});