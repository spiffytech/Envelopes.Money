<script>
  import * as libtxngroup from '../../lib/transactionGroup';
  import { toDollars } from '../../lib/pennies';

  export let txn;
</script>

<a
  style="display: contents"
  href={`/editTxn/${encodeURIComponent(encodeURIComponent(libtxngroup.txnId(txn)))}`}>
  <div class="border rounded-lg">
    <p>{libtxngroup.date(txn)}</p>

    <p class="flex justify-between">
      <span>{libtxngroup.labelOrLabel(txn)}</span>
      <span>{toDollars(libtxngroup.amount(txn))}</span>
    </p>

    <p style="text-overflow: ellipsis" class="whitespace-no-wrap overflow-hidden">
      <span
      title={libtxngroup.fromName(txn) + ', ' + libtxngroup.toNames(txn).join(', ')}
      >{libtxngroup.fromName(txn)} &rightleftarrows; {libtxngroup.toNames(txn).join(', ')}</span>
    </p>
  </div>
</a>
