import TransactionGroup from './TransactionGroup';

export default class Transaction {
    constructor({label, date, memo, fromAccount, toAccount, cleared, type, id, txn_id, coordinates}) {
        this.label = label;
        this.date = date;
        this.memo = memo;
        this.fromAccount = fromAccount;
        this.toAccount = toAccount;
        this.cleared = cleared;
        this.type = type;
        this.id = id;
        this.txn_id = txn_id;
        this.coordinates = coordinates;
    }
    
    group(groups) {
        if (!this.txn_id in groups) {
            groups[this.txn_id] = new TransactionGroup([]);
        }

        groups[this.txn_id] = groups[this.txn_id].add(this);
    }
}
