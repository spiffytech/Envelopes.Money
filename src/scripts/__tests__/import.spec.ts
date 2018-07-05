import {DETxn, learnAccountsFromTxns} from '../../lib/txns';
import * as Txns from '../../lib/txns';
import * as import_ from '../import';
import {GoodBudgetRow, GoodBudgetTxfr} from '../types';

/* tslint:disable:object-literal-sort-keys */

const AssetAccounts = [
  'Checking',
  'Savings',
];

const LiabilityAccounts = ['Credit Card'];

const IncomePayees = ['My Company'];

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

    expect(import_.typeForRow(row)).toEqual('banktxn');
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

    expect(import_.typeForRow(row)).toEqual('banktxn');
  });
});

describe('Parsing categories', () => {
  describe('With this regular transaction', () => {
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

      test('It has the right transaction type', () => {
        expect(txn.type).toBe('banktxn');
      });

      test('It has the right account', () => {
        if (!Txns.isBankTxn(txn)) throw new Error('This should be a bank transaction');
        expect(txn.account).toBe('Checking');
      });

      test('It has the right accounts', () => {
        if (!Txns.isBankTxn(txn)) throw new Error('This should be a bank transaction');
        expect(txn.categories).toEqual({
          'Groceries': -3080,
        });
      });
    });
  });

describe('It learns accounts correctly', () => {
  test('With a checking account', () => {
    const txn: DETxn = {
      id: 'stuff',
      payee: 'whomever',
      date: new Date(),
      memo: '',
      items: {
        'Assets:Checking': -500,
        'Liabilities:Food:Grocery:Fancy': 500,
      }
    }
    expect(learnAccountsFromTxns([txn])).toEqual([
      'Assets',
      'Assets:Checking',
      'Liabilities',
      'Liabilities:Food',
      'Liabilities:Food:Grocery',
      'Liabilities:Food:Grocery:Fancy',
    ]);
  });
});

describe('It sums up these transactions correctly', () => {
  const rows = require('./fixture_1.json');
  let txns: Txns.Txn[] = rows.map((row: GoodBudgetRow) => import_.rowToTxn(row));
  txns = txns.filter((txn) => txn !== null);
  const txnsForChecking = txns.filter(Txns.touchesAccount('Checking'));

  test('It has the right number of transactions', () => {
    expect(txnsForChecking.length).toEqual(28);
  });
});

describe('Naming accounts and categories', () => {
  test('It correctly names asset accounts', () => {
    const actual = import_.nameAccount(AssetAccounts, LiabilityAccounts, mkRow({Account: 'Checking'}));
    expect(actual).toEqual('Assets:Checking');
  });

  test('It correctly names liability accounts', () => {
    const actual = import_.nameAccount(AssetAccounts, LiabilityAccounts, mkRow({Account: 'Credit Card'}));
    expect(actual).toEqual('Liabilities:Credit Card');
  });

  test('It throws an error if it doesn\'t recognise the account', () => {
    expect(() =>
      import_.nameAccount(AssetAccounts, LiabilityAccounts, mkRow({Account: 'Unknown Account'}))
    ).toThrow();
  });
});

describe('Naming outbound categories', () => {
  test('It correctly names income events', () => {
    const actual = import_.mkAccountItems(
      AssetAccounts,
      LiabilityAccounts,
      IncomePayees,
      mkRow({Account: 'Checking', Name: 'My Company'})
    );
    expect(actual).toEqual([
      {account: 'Income:Salary', amount: -234500},
      {account: 'Assets:Checking', amount: 234500},
    ]);
  });

  test('It correctly names non-income events', () => {
    const actual = import_.mkAccountItems(
      AssetAccounts,
      LiabilityAccounts,
      IncomePayees,
      mkRow({Account: 'Checking', Envelope: 'Food', Amount: '-5.00'})
    );
    expect(actual).toEqual([
      {account: 'Assets:Checking', amount: -500},
    ]);
  });
});

describe('Generating items for categories', () => {
  test('It returns one account for regular expenses', () => {
    expect(import_.mkCategoryItems(['Food', -200 as Txns.Pennies, 'Payee'], false, AssetAccounts, LiabilityAccounts)).
      toEqual([{account: 'Liabilities:Food', amount: 200}])
  });

  test('It returns two accounts for fills', () => {
    expect(import_.mkCategoryItems(['Food', 200 as Txns.Pennies, 'Payee'], true, AssetAccounts, LiabilityAccounts)).
      toEqual([
        {account: 'Liabilities:Food', amount: -200},
        {account: 'Expenses:Food', amount: 200}
      ])
  });
});

describe('It converts to a ledger', () => {
  test('With a bank transaction', () => {
    const txn: Txns.BankTxn = {
      _id: 'blah',
      date: new Date().toISOString(),
      amount: -5000 as Txns.Pennies,
      memo: '',
      account: 'Checking',
      payee: 'Food Lion',
      categories: {Grocery: -5000 as Txns.Pennies},
      type: 'banktxn',
    }

    expect(Txns.accountsForTxn(txn)).toEqual([{account: 'Checking', amount: -5000}]);
  });

  test('With an account transfer', () => {
    const txn: Txns.AccountTransfer = {
      _id: 'blah',
      date: new Date().toISOString(),
      amount: -5000 as Txns.Pennies,
      memo: '',
      from: 'Checking',
      to: 'Credit Card',
      txfrId: 'blah1',
      type: 'accountTransfer',
    }

    expect(Txns.accountsForTxn(txn)).toEqual([
      {account: 'Checking', amount: -5000},
      {account: 'Credit Card', amount: 5000},
    ]);
  });
});
