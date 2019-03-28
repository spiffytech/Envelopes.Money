select sums.s as balance, accounts.* from (
    select id, sum(amount) as s from (
        select from_id as id, -amount as amount from transactions union all
        select to_id as id, amount from transactions
) as amounts group by id) as sums join accounts on (accounts.id = sums.id)
order by accounts.type, accounts.name;
