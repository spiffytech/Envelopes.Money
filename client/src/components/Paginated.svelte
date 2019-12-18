<script>
  export let items;
  export let perPage = 20;

  let page = 0;

  function nextPage() {
    page = Math.min(page+1, items.length % perPage);
  }

  function prevPage() {
    page = Math.max(page-1, 0);
  }

  $: itemsStart = Math.min(items.length, page * perPage);
  $: currentItems = items.slice(itemsStart, itemsStart + perPage);
  $: hasNextPage = page < items.length % perPage;
  $: console.log(currentItems);
</script>

<slot items={currentItems} />

{#if page > 0}
  <button on:click|preventDefault={() => prevPage()}>Previous</button>
{/if}

{#if hasNextPage}
  <button on:click|preventDefault={() => nextPage()}>Next</button>
{/if}