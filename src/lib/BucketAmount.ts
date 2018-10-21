import Amount from './Amount';
import BucketReference from './BucketReference';
import {IPOJO as BucketReferencePOJO} from './BucketReference';

export interface IPOJO {
  amount: number;
  bucketRef: BucketReferencePOJO;
}

export default class BucketAmount {
  public static POJO(
    {amount, bucketRef}:
    IPOJO,
  ) {

    return new BucketAmount(
      Amount.Pennies(amount),
      BucketReference.POJO(bucketRef),
    );
  }

  constructor(public amount: Amount, public bucketRef: BucketReference) {}

  public toPOJO() {
    return {
      amount: this.amount.pennies,
      bucketRef: this.bucketRef.toPOJO(),
    };
  }

  public get bucketId() {
    return this.bucketRef.id;
  }

  public get bucketName() {
    return this.bucketRef.name;
  }

  public invertAmount() {
    this.amount = Amount.Pennies(this.amount.pennies * -1);
  }
}
