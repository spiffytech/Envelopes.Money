<script>
  export let title = '';
</script>

<style>
  #bar {
    height: 56px;
  }
</style>

<div id="bar" class="bg-orange-500 flex items-center p-4 justify-between">
  <span class="pl-8 text-lg font-medium">{title}</span>
  <div class="flex">
    <slot name="button1" />
    <slot name="button2" />
  </div>
</div>

<slot />