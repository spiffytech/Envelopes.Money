<script>
  export let tabs = [];

  $: maxRems = Math.max(0, ...tabs.map(tab => tab.title.length)) * 0.8;
</script>

<nav class="w-full">
  <ul class="flex justify-center">
    {#each tabs as tab}
      <a href={tab.url} style="display: contents;">
        <li class="px-4 py-2 border-black border-b-2 flex-1 md:flex-none flex justify-center" style={`width: ${maxRems}rem`}>{tab.title}</li>
      </a>
    {/each}
  </ul>
</nav>