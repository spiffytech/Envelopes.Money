import { shallowMount } from '@vue/test-utils';
import Envelope from '@/components/Envelope.vue';
import * as CommonTypes from '../../../common/lib/types';

describe('Envelope.vue', () => {
  it('renders props.msg when passed', () => {
    const balance: CommonTypes.AccountBalance = {
      bucket: {
        id: 'foo',
        user_id: 'bar',
        name: 'baz',
        type: 'envelope',
        extra: {
          target: 1000,
          interval: 'weekly',
          due: null,
        },
      },
      balance: 500,
    };
    const wrapper = shallowMount(Envelope, {
      propsData: { balance },
    });
    expect(wrapper.text()).toContain('5.00');
    expect(wrapper.text()).toContain('10.00');
    expect(wrapper.text()).toContain('baz');
  });
});
