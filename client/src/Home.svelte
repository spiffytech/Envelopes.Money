<script>
  import Debug from 'debug';
  import { parse as csvParse } from 'json2csv';
  import groupBy from 'ramda/es/groupBy';
  import { getContext } from 'svelte';

  import Icon from './components/Icon.svelte';
  import TopBar from './components/material/TopBar.svelte';

  import Accounts from './Accounts.svelte';
  import { toDollars } from './lib/pennies';

  const debug = Debug('Envelopes.Money:Home.svelte');

  const accountsStore = getContext('accountsStore');
  const transactionsStore = getContext('transactionsStore');
  const topBarStore = getContext('topBarStore');

  function triggerDownload(data, extension) {
    var a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';
    const blob = new Blob([data], { type: 'octet/stream' });
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = `transactions.${extension}`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function exportTxns(transactions) {
    const dataStr = JSON.stringify(Object.values(transactions), null, 4);
    triggerDownload(dataStr, 'json');
  }

  function generateBankActivityExport(transactions, accounts) {
    const accountsMap = new Map(
      accounts.map(account => [account.id, account.name])
    );

    const txnsWithAccountNames = transactions
      .filter(txn => txn.type !== 'envelopeTransfer')
      .map(txn => ({
        ...txn,
        from: accountsMap.get(txn.from_id),
        to: accountsMap.get(txn.to_id),
      }));
    const groups = groupBy(txn => txn.txn_id, txnsWithAccountNames);
    debug('Exporting groups: %o', groups);
    const groupTxns = Object.values(groups).map(txns => ({
      amount: toDollars(
        txns.map(txn => -txn.amount).reduce((acc, item) => acc + item, 0)
      ),
      label: txns[0].label,
      date: txns[0].date,
      memo: txns[0].memo,
      from: txns[0].from,
      to: txns.map(txn => txn.to).join(','),
      cleared: txns[0].cleared,
      ...(txns[0].type === 'banktxn'
        ? { coordinates: txns[0].coordinates }
        : {}),
      type: txns[0].type,
      txn_id: txns[0].txn_id,
    }));
    debug('Exporting grouped transactions: %o', groupTxns);

    return groupTxns;
  }

  function exportBankActivity(transactions, accounts) {
    const groupTxns = generateBankActivityExport(transactions, accounts);
    const dataStr = JSON.stringify(groupTxns, null, 4);
    triggerDownload(dataStr, 'json');
  }

  function exportBankActivityCsv(transactions, accounts) {
    const groupTxns = generateBankActivityExport(transactions, accounts);
    const dataStr = csvParse(groupTxns, {fields: ['date', 'label', 'memo', 'from', 'to', 'cleared', 'type', 'amount']});
    triggerDownload(dataStr, 'csv');
  }
</script>

<TopBar title="Envelopes">
  <button
    class="btn btn-tertiary"
    on:click|preventDefault={() => exportTxns($transactionsStore)}>
    Export Transactions Raw
  </button>
  <button
    class="btn btn-tertiary"
    on:click|preventDefault={() => exportBankActivity($transactionsStore, $accountsStore)}>
    Export Bank Activity
  </button>
  <button
    class="btn btn-tertiary"
    on:click|preventDefault={() => exportBankActivityCsv($transactionsStore, $accountsStore)}>
    Export Bank Activity (CSV)
  </button>

  <div slot="button1">
    <a href="/fill" class="p-3">
      <Icon prefix="far" icon="envelope" size={16} />
      <Icon prefix="fas" icon="arrow-right" size={16} />
      <Icon prefix="fas" icon="dollar-sign" size={16} />
    </a>
  </div>

  <div slot="button2">
    <a href="/editAccount" class="p-3"><Icon prefix="fas" icon="plus" size={16} /></a>
  </div>

  <Accounts />
</TopBar>