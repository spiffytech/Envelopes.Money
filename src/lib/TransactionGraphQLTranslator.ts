import * as shortid from 'shortid';

import Account from './Account';
import Amount from './Amount';
import Category from './Category';
import Transaction, { isBucketAmountAccount, isPOJOA, ITxnPOJOIn, ITxnPOJOOut } from './Transaction';
import TransactionFactory from './TransactionFactory';

export default class TransactionGraphQLTranslator {
  public static fromGraphQL(transaction: ITxnPOJOIn): Transaction {
    const from =
      isPOJOA(transaction) ?
        new Account(transaction.from_account) :
        Category.POJO(transaction.from_category);

    const to = transaction.to.map((t) => ({
      amount: Amount.Pennies(t.amount),
      bucket:
        isBucketAmountAccount(t) ?
          new Account(t.account) :
          Category.POJO(t.category),
    }));

    return TransactionFactory(
      {
        id: transaction.id,
        date: new Date(transaction.date),
        payee: transaction.payee,
        memo: transaction.memo,
        from,
        to,
        userId: transaction.user_id,
      },
      transaction.type,
    );
  }

  public static toGraphQL(transaction: Transaction): ITxnPOJOOut {
    return {
      id: transaction.id,
      date: transaction.date.toJSON(),
      amount: transaction.amount.pennies,
      payee: transaction.payee,
      memo: transaction.memo,
      from_account_id:
        transaction.from.type === 'account' ? 
        transaction.from.id :
        null,
      from_category_id:
        transaction.from.type === 'category' ? 
        transaction.from.id :
        null,
      to: {
        data: transaction.to.map((to) => ({
          id: shortid.generate(),
          amount: to.amount.pennies,
          account_id: to.bucket.type === 'account' ? to.bucket.id : null,
          category_id: to.bucket.type === 'category' ? to.bucket.id : null,
          user_id: transaction.userId,
        })),
      },
      type: transaction.withType((type) => type),
      user_id: transaction.userId,
    };
  }
}
