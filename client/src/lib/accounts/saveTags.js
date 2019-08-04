import immer from 'immer';

/**
 * Given some accounts that changed, save them to the DB and update the acconut
 * store
 */
export default async function saveTags(
  { accountsStore },
  { accountsColl },
  accountsThatChanged
) {
  await Promise.all(
    accountsThatChanged.map(account => accountsColl.upsert(account))
  );
  accountsStore.update(accounts =>
    immer(accounts, draft =>
      accountsThatChanged.forEach(changedAccount => {
        const index = draft.findIndex(
          account => account.id === changedAccount.id
        );
        draft[index] = changedAccount;
      })
    )
  );
}
