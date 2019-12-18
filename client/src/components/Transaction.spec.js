const Wrapper = require('./Wrapper.svelte');
const Wrapper2 = require('./Wrapper2.svelte');
const Nested = require('./Nested.svelte');
const Nested2 = require('./Nested2.svelte');
const { render, cleanup } = require('@testing-library/svelte');
const { waitForElement } = require('@testing-library/dom');

beforeEach(cleanup);

describe('Nested', () => {
  /*
  it('Should render the context', async () => {
    const { getByText } = render(Wrapper, {
      props: { import_: './Nested.svelte', contexts: { foo: 'foo' } },
    });
    await waitForElement(() => getByText('foo'));
    expect(getByText('foo'));
  });

*/
  it('Should render the context', async () => {
    const { getByText } = render(Wrapper2, {
      props: { component: Nested, contexts: { foo: 'foo' } },
    });
    await waitForElement(() => getByText('foo'));
    expect(getByText('foo'));
  });
});
