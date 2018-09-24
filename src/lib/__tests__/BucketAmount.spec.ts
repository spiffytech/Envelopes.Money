import BucketAmount from '@/lib/BucketAmount';
import BucketReference from '@/lib/BucketReference';
import Amount from '../Amount';

describe('Delegation to the underlying BucketReference', () => {
  it('Has a name', () => {
    const bucketAmount = new BucketAmount(
      Amount.Pennies(0),
      new BucketReference({name: 'cows', id: 'cows1', type: 'account'}),
    );

    expect(bucketAmount.bucketName).toBe('cows');
  });

  it('Has an id', () => {
    const bucketAmount = new BucketAmount(
      Amount.Pennies(0),
      new BucketReference({name: 'cows', id: 'cows1', type: 'account'}),
    );

    expect(bucketAmount.bucketId).toBe('cows1');
  });
});
