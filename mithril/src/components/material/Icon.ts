import { IconPrefix, IconName, icon as renderIcon } from '@fortawesome/fontawesome-svg-core';
import m from 'mithril';

interface IconProps {
  prefix: IconPrefix;
  icon: IconName;
  size?: number;
}

export default function Icon(): m.Component<IconProps> {
  return {
    view({attrs: {prefix, icon, size}}) {
      //const i = renderIcon({prefix, iconName: icon}, {transform: {size: (size || 4) * 8}});
      const i = renderIcon({prefix, iconName: icon}, {classes: `fa-${size}x`});
      if (!i) throw new Error(`No such icon: ${prefix} ${icon}`);
      return m('span', m.trust(i.html[0]));
    }
  };
}