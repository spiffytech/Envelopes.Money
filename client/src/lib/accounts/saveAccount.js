import immer from 'immer';

/**
 * Given some accounts that changed, save them to the DB and update the acconut
 * store
 */
export default async function saveTags(
  { accountsStore },
  dexie,
  account
) {
  await dexie.accounts.put(account);
  accountsStore.update($accounts => immer($accounts, draft => {
    const index = draft.findIndex(a => a.id === account.id);
    draft[index] = account;
  }));
}

