(async () => {
	const {rows} = await localDB.remoteDB.query(
    	{
            map: function (doc, emit) {
                if (doc.type_ !== 'transaction') return;		
                emit(doc.txn_id, doc);
        	}.toString(),
			reduce: function(keys, values, rereduce) {
				var to_ids = [];
				var amounts = 0;
				for (var i = 0; i < values.length; i++) {
					var value = values[i];
					to_ids.push(value.to_id);
					amounts += -value.amount;
                }
				var to_ids_str = to_ids.join(',')
				return {
					to_ids: to_ids_str,
					amount: amounts,
					txn_id: values[0].txn_id,
					user_id: values[0].user_id,
					label: values[0].label,
					date: values[0].date,
					memo: values[0].memo,
					from_id: values[0].from_id,
					type: values[0].type,
					insertionOrder: values[0].insertion_order,
					cleared: values[0].cleared
                }
            }.toString()
    }, {group: true, reduce: true});
	console.log(rows);
})();


// Delete extra Equity/Unallocated accounts
(async () => {
	const {docs} = await localDB.find({selector: {type_: 'account'}});
	const balances = await Promise.all(docs.map(async ({id}) => [id, await localDB.query('transactions/by-account', {startkey: [id, ''], endkey: [id, '\ufff0'], include_docs: true})]));
	const countPerAccount = balances.map(([id, results]) => [id, results.rows.length]);
	const deadAccounts = countPerAccount.filter(([id, count]) => count === 0);
	const deadAccountNames = await Promise.all(deadAccounts.map(([id]) => localDB.get(id)));
	console.log(deadAccountNames);
	//await Promise.all(deadAccountNames.map(account => localDB.put({...account, _deleted: true})));
})()
