import bencode from 'bencode';
import immer from 'immer';
import shajs from 'sha.js';

/**
 * Given some accounts that changed, save them to the DB and update the acconut
 * store
 */
export default async function saveTags({ accountsStore }, dexie, account) {
  const accountWithFingerprint = {
    ...account,
    _fingerprint: shajs('sha256')
      .update(bencode.encode(JSON.stringify(account)))
      .digest('hex'),
  };

  await dexie.accounts.put(accountWithFingerprint);
  accountsStore.update($accounts =>
    immer($accounts, draft => {
      const index = draft.findIndex(a => a.id === accountWithFingerprint.id);
      draft[index] = accountWithFingerprint;
    })
  );
}
