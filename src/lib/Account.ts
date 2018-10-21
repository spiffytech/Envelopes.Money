export interface AccountPOJO {
  id: string;
  name: string;
}

export default class Account {
    public type = 'account';

    public id: string;
    public name: string;

    public constructor({id, name}: AccountPOJO) {
        this.id = id;
        this.name = name;
    }
}
