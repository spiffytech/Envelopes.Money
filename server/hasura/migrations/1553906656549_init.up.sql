--
-- SQL edited by https://hasura-edit-pg-dump.now.sh
--

;

COMMENT ON SCHEMA public IS 'standard public schema';

CREATE TABLE public.accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    extra jsonb NOT NULL
);

CREATE TABLE public.transactions (
    id text NOT NULL,
    user_id text NOT NULL,
    memo text,
    date date NOT NULL,
    amount integer NOT NULL,
    label text,
    txn_id text NOT NULL,
    from_id text NOT NULL,
    to_id text NOT NULL,
    type text NOT NULL
);

CREATE VIEW public.balances AS
 SELECT COALESCE(sums.s, (0)::bigint) AS balance,
    accounts.id,
    accounts.user_id,
    accounts.name,
    accounts.type,
    accounts.extra
   FROM (( SELECT amounts.id,
            sum(amounts.amount) AS s
           FROM ( SELECT transactions.from_id AS id,
                    (- transactions.amount) AS amount
                   FROM public.transactions
                UNION ALL
                 SELECT transactions.to_id AS id,
                    transactions.amount
                   FROM public.transactions
                  WHERE (transactions.type <> 'banktxn'::text)
                UNION ALL
                 SELECT transactions.to_id AS id,
                    (- transactions.amount)
                   FROM public.transactions
                  WHERE (transactions.type = 'banktxn'::text)) amounts
          GROUP BY amounts.id) sums
     RIGHT JOIN public.accounts ON ((accounts.id = sums.id)))
  ORDER BY accounts.type, accounts.name;

CREATE VIEW public.top_labels AS
 SELECT DISTINCT ON (counts.label) counts.label,
    counts.count,
    counts.to_id,
    accounts.user_id,
    accounts.name,
    counts.from_id
   FROM (( SELECT count(*) AS count,
            transactions.from_id,
            transactions.to_id,
            transactions.label
           FROM public.transactions
          GROUP BY transactions.label, transactions.to_id, transactions.from_id) counts
     JOIN public.accounts ON ((accounts.id = counts.to_id)))
  ORDER BY counts.label, counts.count DESC;

CREATE VIEW public.txns_grouped AS
 SELECT t1.to_names,
    t1.to_ids,
    t1.amount,
    transactions.txn_id,
    transactions.user_id,
    transactions.label,
    transactions.date,
    transactions.memo,
    transactions.type,
    transactions.from_id,
    transactions.from_name
   FROM (( SELECT transactions_1.txn_id,
            string_agg(accounts.name, ', '::text ORDER BY accounts.name) AS to_names,
            string_agg(transactions_1.id, ','::text) AS to_ids,
            sum((- transactions_1.amount)) AS amount
           FROM (public.transactions transactions_1
             JOIN public.accounts ON ((transactions_1.to_id = accounts.id)))
          GROUP BY transactions_1.txn_id) t1
     LEFT JOIN ( SELECT DISTINCT transactions_1.txn_id,
            transactions_1.user_id,
            transactions_1.label,
            transactions_1.date,
            transactions_1.memo,
            transactions_1.type,
            transactions_1.from_id,
            accounts.name AS from_name
           FROM (public.transactions transactions_1
             JOIN public.accounts ON (((transactions_1.from_id = accounts.id) AND (transactions_1.user_id = accounts.user_id))))) transactions USING (txn_id))
  ORDER BY transactions.date DESC;

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    scrypt text NOT NULL,
    apikey text NOT NULL
);

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_from_id_fkey FOREIGN KEY (from_id) REFERENCES public.accounts(id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_to_id_fkey FOREIGN KEY (to_id) REFERENCES public.accounts(id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);

