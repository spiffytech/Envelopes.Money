import Amount from '../Amount';
import BucketAmount from '../BucketAmount';
import BucketReference from '../BucketReference';

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
