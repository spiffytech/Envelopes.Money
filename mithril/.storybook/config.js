import { configure } from '@storybook/mithril';

// automatically import all files ending in *.stories.js
configure(require.context('../stories', true, /\.stories\.[jt]s$/), module);
