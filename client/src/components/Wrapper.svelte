<script>
  import {setContext} from 'svelte';

  const {contexts, import_, ...props} = $$props;
  setContext('foo', 'foo');

  let component = null;
  import(import_).then(c => component = c.default);
</script>

{#if component}
  <svelte:component this={component} {...props} />
{/if}
