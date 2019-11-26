import * as libtransaction from './Transactions';

/** @typedef {import('../types.d').TransactionGroup} TransactionGroup */

/**
 * @param {TransactionGroup} txnGroup
 */
export function txnId(txnGroup) {
  return libtransaction.txnId(txnGroup[0]);
}
/**
 * @param {TransactionGroup} txnGroup
 */
export function date(txnGroup) {
  return libtransaction.date(txnGroup[0]);
}

/**
 * @param {TransactionGroup} txnGroup
 * @return {number} Sum of all amounts in the group
 */
export function amount(txnGroup) {
  return txnGroup
    .map(txn => libtransaction.amount(txn))
    .reduce((acc, item) => acc + item, 0);
}

/**
 * @param {TransactionGroup} txnGroup
 * @return {string}
 */
export function labelOrLabel(txnGroup) {
  return (
    libtransaction.label(txnGroup[0]) ||
    libtransaction.friendlyTypeName(txnGroup[0])
  );
}

/**
 * @param {TransactionGroup} txnGroup
 * @return {string}
 */
export function fromName(txnGroup) {
  return txnGroup[0].from.name;
}

/**
 * @param {TransactionGroup} txnGroup
 * @return {string[]}
 */
export function toNames(txnGroup) {
  return txnGroup.map(txn => txn.to.name);
}
