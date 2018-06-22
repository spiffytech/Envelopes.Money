import {GoodBudgetRow, GoodBudgetTxfr} from '../types';
import * as import_ from '../import';
import {DETxn, sumAccountTotal, learnAccountsFromTxns, groupByAccount} from '../../lib/txns';

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

      const txn = import_.rowToTxn(AssetAccounts, LiabilityAccounts, IncomePayees, row);
      if (!txn) throw new Error('txn was null');
      expect(txn.items).toEqual({
        'Liabilities:Groceries': 3080,
        'Assets:Checking': -3080,
      });
  });

  test('It categorizes this random transaction', () => {
    const row: GoodBudgetRow = {
      Date: '06/07/2018',
      Envelope: 'Car stuff',
      Account: 'Credit Card',
      Name: 'NCDMV',
      Notes: 'License(Lacey)',
      Amount: '-13.00',
      Status: '',
      Details: ''
    }

    const txn = import_.rowToTxn(AssetAccounts, LiabilityAccounts, IncomePayees, row);
    if (!txn) throw new Error('Txn was not present');
    expect(txn.items).toEqual({
      'Liabilities:Car stuff': 1300,
      'Liabilities:Credit Card': -1300,
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

describe('It groups accounts correctly', () => {
  test('With a checking account', () => {
    const txns: DETxn[] = [
      {
        id: 'stuff',
        payee: 'whomever',
        date: new Date(),
        memo: '',
        items: {
          'Assets:Checking': -500,
          'Liabilities:Food:Grocery:Fancy': 500,
        }
      },
      {
        id: 'stuff2',
        payee: 'whomever2',
        date: new Date(),
        memo: '',
        items: {
          'Liabilities:Credit Card': -500,
          'Liabilities:Food:Grocery:Fancy': 500,
        }
      }
    ];

    expect(txns.reduce(groupByAccount, {} as {[key: string]: any})).toEqual({
      'Assets:Checking': [{account: 'Assets:Checking', amount: -500}],
      'Liabilities:Credit Card': [{account: 'Liabilities:Credit Card', amount: -500}],
      'Liabilities:Food:Grocery:Fancy': [
        {account: 'Liabilities:Food:Grocery:Fancy', amount: 500},
        {account: 'Liabilities:Food:Grocery:Fancy', amount: 500},
      ],
    })
  });
});

describe('It sums up these transactions correctly', () => {
  const rows = require('./fixture_1.json');
  let txns: DETxn[] = rows.map((row: GoodBudgetRow) =>
    import_.rowToTxn(AssetAccounts, LiabilityAccounts, IncomePayees, row)
  ).filter((txn: any) => txn);
  txns = txns.filter((txn) => txn !== null);
  const txnsForChecking = txns.filter((txn) => txn.items['Assets:Checking']);

  test('It gives all rows the right account', () => {
    expect(sumAccountTotal('Assets:Checking', txnsForChecking)).toEqual(19099);
  });

  test('It has the right number of transactions', () => {
    expect(txnsForChecking.length).toEqual(28);
  });
});

describe('Naming accounts and categories', () => {
  const AssetAccounts = [
    'Checking',
    'Savings',
  ];

  const LiabilityAccounts = ['Credit Card'];

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
  const AssetAccounts = [
    'Checking',
    'Savings',
  ];

  const LiabilityAccounts = ['Credit Card'];

  const IncomePayees = ['My Company'];

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
    expect(import_.mkCategoryItems(['Food', -200], false)).
      toEqual([{account: 'Liabilities:Food', amount: 200}])
  });

  test('It returns two accounts for fills', () => {
    expect(import_.mkCategoryItems(['Food', 200], true)).
      toEqual([
        {account: 'Liabilities:Food', amount: -200},
        {account: 'Expenses:Food', amount: 200}
      ])
  });
});

describe('Parsing categories', () => {
  const itemsOneCategory = import_.ItemsForRow(
    AssetAccounts, LiabilityAccounts, IncomePayees,
    mkRow({Amount: '-5.00', Account: 'Checking', Envelope: 'Food'})
  );
  const itemsTwoCategories = import_.ItemsForRow(
    AssetAccounts, LiabilityAccounts, IncomePayees,
    mkRow({Amount: '-5.02', Account: 'Checking', Details:  'Food|-2.01||Grocery|-3.01'})
  );
  const incomeTwoCategories = import_.ItemsForRow(
    AssetAccounts, LiabilityAccounts, IncomePayees,
    mkRow({Amount: '05.00', Name: 'My Company', Account: 'Checking', Details:  'Food|2.00||Grocery|3.00'})
  );

  test('It parses this test transaction', () => {
    const actual = import_.parseCategories(
      mkRow({Amount: '05.00', Name: 'My Company', Account: 'Checking', Details:  'Food|2.00||Grocery|3.00'})
    );
    expect(actual).toEqual({'Food': 200, 'Grocery': 300});
  });

  test('Single category transactions have the right Items', () => {
    expect(itemsOneCategory).toEqual([
      {account: 'Assets:Checking', amount: -500},
      {account: 'Liabilities:Food', amount: 500},
    ]);
  });

  test('Two category transactions have the right Items', () => {
    expect(itemsTwoCategories).toEqual([
      {account: 'Assets:Checking', amount: -502},
      {account: 'Liabilities:Food', amount: 201},
      {account: 'Liabilities:Grocery', amount: 301},
    ]);
  });

  test('Income transactions have the right Items', () => {
    expect(incomeTwoCategories).toEqual([
      {account: 'Income:Salary', amount: -500},
      {account: 'Assets:Checking', amount: 500},

      {account: 'Liabilities:Food', amount: -200},
      {account: 'Expenses:Food', amount: 200},

      {account: 'Liabilities:Grocery', amount: -300},
      {account: 'Expenses:Grocery', amount: 300},
    ]);
  });
});