import * as Accounts from '../lib/Accounts';
import * as Envelope from '../lib/Envelope';

export function saveAccount(graphql, account) {
    return Accounts.saveAccount(graphql, account);
}

export function mkEmptyEnvelope(userId) {
    return Envelope.mkEmptyEnvelope(userId);
}