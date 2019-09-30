<script>
  import { interpret, Machine } from 'xstate';

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

  const reportsMachine = Machine(
    {
      id: 'reports',
      strict: true,
      initial: 'loading',
      context: {
        report: null,
      },

      states: {
        loading: {
          invoke: {
            id: 'loadReports',
            src: (...args) => Promise.resolve(loadReports()),
            onDone: [
              {
                target: 'reportSelected',
                cond: 'hasSelection'
              },
              {
                target: 'noReport',
              },
            ],
            onError: {
              target: 'error'
            }
          },
        },
        noReport: {
          on: {
            REPORT_SELECTED: 'reportSelected'
          }
        },
        reportSelected: {
          on: {
            RUN: 'runningReport',
            REPORT_SELECTED: 'reportSelected'
          }
        },
        runningReport: {
          on: {
            FINISHED: 'reportSelected'
          }
        },
        error: {}
      },

      guards: {
        hasSelection(context, event) {
          return selectedReport !== null
        }
      }
    }
  );

  const service = interpret(reportsMachine);
  service.start();
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