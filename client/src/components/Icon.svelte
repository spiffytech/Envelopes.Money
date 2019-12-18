<script>
  import { icon as renderIcon } from '@fortawesome/fontawesome-svg-core';

  export let prefix;
  export let icon;
  export let size = 32;

  if (!prefix) throw new Error('Must have a FontAwesome prefix');
  if (!icon) throw new Error('Must have a FontAwesome icon name');

  const i = renderIcon(
    { prefix, iconName: icon },
    { transform: { size } }
  );

  if (!i) throw new Error(`No such icon: ${prefix} ${icon}`);
</script>

{@html i.html}
