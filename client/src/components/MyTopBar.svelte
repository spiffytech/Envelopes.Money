<script>
  import TopBar from './material/TopBar.svelte';
  
  import tabs from '../lib/tabs';

  export let title;
</script>

<TopBar {title} {tabs}>
  <slot />
  <div slot="slot1" style="display: contents;">
    <slot name="button1" />
  </div>
  <div slot="slot2" style="display: contents;">
    <slot name="button2" />
  </div>
</TopBar>