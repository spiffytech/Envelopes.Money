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

/**
 * @param {TransactionGroup} txnGroup
 * @return {string | null}
 */
export function memo(txnGroup) {
  return libtransaction.memo(txnGroup[0]);
}

/**
 * @param {{account: string | null, envelope: string | null, term: string}} terms
 */
export function filter(terms) {
  /**
   * @param {TransactionGroup} txnGroup
   * @return {boolean}
   */
  function filterInner(txnGroup) {
    let doesMatch = true;
    let matchesAccount = false;
    let matchesEnvelope = false;
    let matchesTerm = false;

    if (terms.account) {
      const re = new RegExp(terms.account);
      if (re.test(fromName(txnGroup))) matchesAccount = true;
      if (toNames(txnGroup).some(name => re.test(name))) matchesAccount = true;
    }
    if (terms.envelope) {
      const re = new RegExp(terms.envelope);
      if (re.test(fromName(txnGroup))) matchesEnvelope = true;
      if (toNames(txnGroup).some(name => re.test(name))) matchesEnvelope = true;
    }

    if (terms.term) {
      const re = new RegExp(terms.term);
      matchesTerm =
        re.test(fromName(txnGroup)) ||
        toNames(txnGroup).some(name => re.test(name)) ||
        re.test(labelOrLabel(txnGroup)) ||
        re.test(memo(txnGroup) || '');
    }

    if (terms.account) doesMatch = doesMatch && matchesAccount;
    if (terms.envelope) doesMatch = doesMatch && matchesEnvelope;
    if (terms.term) doesMatch = doesMatch && matchesTerm;

    return doesMatch;
  }

  return filterInner;
}
