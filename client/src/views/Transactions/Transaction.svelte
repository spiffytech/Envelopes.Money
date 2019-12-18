<script>
  import * as libtxngroup from '../../lib/transactionGroup';
  import { toDollars } from '../../lib/pennies';

  export let txn;
</script>

<a
  style="display: contents"
  href={`/editTxn/${encodeURIComponent(encodeURIComponent(libtxngroup.txnId(txn)))}`}>
  <div class="border rounded-lg p-3">
    <p class="text-sm">{libtxngroup.date(txn)}</p>

    <p class="flex justify-between">
      <span>{libtxngroup.labelOrLabel(txn)}</span>
      <span class="text-sm">{toDollars(libtxngroup.amount(txn))}</span>
    </p>

    <p style="text-overflow: ellipsis" class="whitespace-no-wrap overflow-hidden text-sm">
      <span
      title={libtxngroup.fromName(txn) + ', ' + libtxngroup.toNames(txn).join(', ')}
      >{libtxngroup.fromName(txn)} &rightleftarrows; {libtxngroup.toNames(txn).join(', ')}</span>
    </p>
  </div>
</a>
