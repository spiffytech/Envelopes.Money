import * as shortid from 'shortid';
import {DETxn} from './types';

/* tslint:disable:object-literal-sort-keys */

const params = {params: {email: 'bogus@bogus.net', txnId: 'bogus-txn'}};
module.exports.params = params;

const testCreate: DETxn = {
  id: shortid.generate(),
  payee: 'Test Payee',
  date: new Date(),
  memo: 'Test Transaction',
  items: {
    'Assets:Bank:Checking': -500,
    'Liabilities:Budget:Food': 500,
  }
}

module.exports.testCreate = testCreate;

const testUpdate: {before: DETxn, after: DETxn} = {
  before: {
    id: shortid.generate(),
    payee: 'Test Payee',
    date: new Date(),
    memo: 'Test Transaction',
    items: {
      'Assets:Bank:Checking': -500,
      'Liabilities:Budget:Food': 500,
    }
  },

  after: {
    id: shortid.generate(),
    payee: 'Test Payee',
    date: new Date(),
    memo: 'Test Transaction',
    items: {
      'Assets:Bank:Checking': -300,
      'Liabilities:Budget:Food': 300,
    }
  }
};

module.exports.testUpdate = testUpdate;

const testUpdate2: {before: DETxn, after: DETxn} = {
  before: {
    id: shortid.generate(),
    payee: 'Test Payee',
    date: new Date(),
    memo: 'Test Transaction',
    items: {
      'Assets:Bank:Checking': -500,
      'Liabilities:Budget:Food': 500,
    }
  },

  after: {
    id: shortid.generate(),
    payee: 'Test Payee',
    date: new Date(),
    memo: 'Test Transaction',
    items: {
      'Assets:Bank:Checking': -300,
      'Liabilities:Budget:Food': 300,
    }
  }
};

module.exports.testUpdate2 = testUpdate2;