<script>
  import Report from './Report.svelte';

  export let params;

  let reports = [];
  let selectedReport = null;

  function loadReports() {
    reports = [
      {
        id: '1',
        canSave: false,
        name: 'Spending By Payee',
        fn: function(transactions) {
          console.log(transactions);
        }.toString()
      }
    ]
  }

</script>

<p>Reports</p>

<ul>
  {#each reports as report}
    <li><a href={`/reports/${report.id}`}>{report.name}</a></li>
  {/each}
</ul>

{#if selectedReport}
  <Report report={selectedReport} />
{/if}

{JSON.stringify(params)}
