<script>
  import {setContext} from 'svelte';

  export let component = null;

  const {contexts, ...props} = $$props;
  setContext('foo', 'foo');
</script>

{#if component}
  <svelte:component this={component} {...props} />
{/if}
