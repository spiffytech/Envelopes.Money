drop view txns_grouped;
create view txns_grouped as
select t1.to_names as to_names, t1.to_ids as to_ids, t1.amount, transactions.* from (
    select
        txn_id,
        string_agg(name, ', ' order by name) as to_names,
        string_agg(transactions.id, ',') as to_ids,
        sum(-amount) as amount
    from transactions 
    join accounts on (transactions.to_id = accounts.id)
    group by txn_id
) as t1 left join (
    select
        distinct txn_id,
        transactions.user_id,
        label,
        date,
        memo,
        transactions.type,
        from_id,
        accounts.name as from_name
    from transactions
    join accounts on (transactions.from_id=accounts.id and transactions.user_id=accounts.user_id)
) as transactions using (txn_id) order by date desc;
