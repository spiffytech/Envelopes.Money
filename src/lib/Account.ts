export interface IAccountPOJO {
  id: string;
  name: string;
  user_id: string;
}

export function isAccount(bucket: any): bucket is Account {
  return bucket.type === 'account';
}

export default class Account {
    public type = 'account';

    public id: string;
    public name: string;

    public constructor({id, name}: IAccountPOJO) {
        this.id = id;
        this.name = name;
    }
}
