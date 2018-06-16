"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const csv_parse_1 = __importDefault(require("csv-parse"));
const mz_1 = require("mz");
const nconf_1 = __importDefault(require("nconf"));
require('source-map-support').install();
nconf_1.default.argv().env().required(['file']);
function amountOfStr(str) {
    return parseInt(str.replace('.', '').replace(',', ''));
}
async function readCsv(file) {
    const contents = await mz_1.fs.readFile(file);
    return new Promise((resolve, reject) => {
        csv_parse_1.default(contents.toString(), { columns: true, escape: '\\' }, (err, data) => {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
}
function parseCategories(row) {
    return (row.Envelope ? { [row.Envelope]: amountOfStr(row.Amount) } :
        row.Details.split('||').
            map((detail) => detail.split('|')).
            reduce((acc, [category, amount]) => (Object.assign({}, acc, { [category]: amountOfStr(amount) })), {}));
}
/**
 * GoodBudget's export breaks account transfers into two transactions, so we'd
 * import double transfers (or transfers with no payees) if we imported as-is
 */
function mergeAccountTransfers(rows) {
    const newRows = [];
    const txfs = {};
    rows.forEach((row) => {
        if (row.Notes !== 'Account Transfer')
            return newRows.push(row);
        const key = `${row.Date}-${row.Amount.replace('-', '')}`;
        const arr = txfs[key];
        txfs[key] = [...(arr || []), row];
    });
    Object.values(txfs).forEach((rows) => {
        const from = rows.find((row) => parseFloat(row.Amount) < 0);
        const to = rows.find((row) => parseFloat(row.Amount) > 0);
        newRows.push(Object.assign({}, from, { Name: to.Account }));
    });
    return newRows;
}
function rowToTxn(row) {
    if (row.Account === '[none]')
        return null; // It's a fill
    const type = row.Notes === 'Account Transfer' ?
        'accountTransfer' :
        row.Notes === 'Envelope Transfer' || (row.Account === '' && row.Envelope !== '[Unallocated]') ?
            'envelopeTransfer' :
            'transaction';
    console.log(row);
    if (amountOfStr(row.Amount) === 600000)
        console.log(row);
    if (type === 'envelopeTransfer')
        return null;
    const categories = row.Notes !== 'Account Transfer' ? parseCategories(row) : {};
    return {
        date: new Date(row.Date),
        payee: row.Name,
        account: row.Account,
        memo: row.Notes,
        amount: amountOfStr(row.Amount),
        categories,
        type,
    };
}
function groupBy(arr, fn) {
    return arr.reduce((acc, item) => (Object.assign({}, acc, { [fn(item)]: [...(acc[fn(item)] || []), item] })), {});
}
function nullFilter(item) {
    return Boolean(item);
}
function sumAccountTotal(txns) {
    return txns.reduce((total, txn) => total + txn.amount, 0);
}
async function main() {
    const rows = await readCsv(nconf_1.default.get('file'));
    const txns = rows.map(rowToTxn).filter(nullFilter);
    const groups = groupBy(txns.filter((txn) => txn.account), ((txn) => txn.account));
    console.log(groups['Money Market']);
    console.log(sumAccountTotal(groups['Money Market']));
}
main();
