-- =========================================================
-- ROI INVESTMENT PLATFORM — SUPABASE SCHEMA
-- Run this in the Supabase SQL editor (Project > SQL Editor)
-- =========================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "uuid-ossp";

-- ---------- ENUM TYPES ----------
create type user_role as enum ('investor', 'agent', 'admin');
create type kyc_status as enum ('unsubmitted', 'pending', 'approved', 'rejected');
create type request_status as enum ('pending', 'approved', 'rejected');
create type investment_status as enum ('active', 'completed', 'cancelled');
create type tx_type as enum ('deposit', 'withdrawal', 'investment', 'roi_payout', 'referral_commission');
create type tx_status as enum ('pending', 'completed', 'failed');

-- ---------- PROFILES ----------
-- Extends auth.users. One row per signed-up user.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  role user_role not null default 'investor',
  referral_code text unique not null,
  referred_by uuid references profiles(id) on delete set null,
  kyc_status kyc_status not null default 'unsubmitted',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- WALLETS ----------
create table wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique not null references profiles(id) on delete cascade,
  balance numeric(14,2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- ---------- INVESTMENT PLANS (admin-defined) ----------
create table investment_plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  min_amount numeric(14,2) not null,
  max_amount numeric(14,2) not null,
  roi_percent numeric(6,2) not null,       -- total return over duration, e.g. 20.00 = 20%
  duration_days int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- INVESTMENTS ----------
create table investments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan_id uuid not null references investment_plans(id),
  amount numeric(14,2) not null,
  expected_return numeric(14,2) not null,
  status investment_status not null default 'active',
  started_at timestamptz not null default now(),
  matures_at timestamptz not null,
  completed_at timestamptz
);

-- ---------- TRANSACTIONS (ledger — every wallet movement) ----------
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type tx_type not null,
  amount numeric(14,2) not null,
  status tx_status not null default 'completed',
  reference text,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- DEPOSITS (manual, admin-approved) ----------
create table deposits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric(14,2) not null,
  payment_reference text,
  proof_url text,
  status request_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- WITHDRAWALS (manual, admin-approved) ----------
create table withdrawals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric(14,2) not null,
  payout_method text,
  payout_details text,
  status request_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- REFERRALS (multi-level tree, denormalized edge list) ----------
create table referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references profiles(id) on delete cascade,
  referred_id uuid not null references profiles(id) on delete cascade,
  level int not null default 1,     -- 1 = direct, 2 = second-level, 3 = third-level...
  created_at timestamptz not null default now(),
  unique (referrer_id, referred_id)
);

-- ---------- REFERRAL COMMISSION RATES (per level, admin-configurable) ----------
create table referral_levels (
  level int primary key,
  percent numeric(5,2) not null
);
insert into referral_levels (level, percent) values (1, 5.00), (2, 2.00), (3, 1.00);

-- ---------- KYC SUBMISSIONS ----------
create table kyc_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  id_type text not null,
  id_number text not null,
  id_image_url text not null,
  status request_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES
-- =========================================================
create index idx_transactions_user on transactions(user_id, created_at desc);
create index idx_investments_user on investments(user_id);
create index idx_referrals_referrer on referrals(referrer_id);
create index idx_deposits_status on deposits(status);
create index idx_withdrawals_status on withdrawals(status);

-- =========================================================
-- HELPER: is the current user an admin?
-- =========================================================
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================
-- SIGNUP TRIGGER — creates profile + wallet + referral code
-- Reads full_name, phone, referral_code from auth signup metadata
-- =========================================================
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  referrer profiles;
  lvl int;
  current_upline uuid;
begin
  -- generate a short unique referral code
  new_code := upper(substr(md5(new.id::text || now()::text), 1, 8));

  insert into profiles (id, full_name, email, phone, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', new.phone, ''),
    new_code,
    (select id from profiles where referral_code = new.raw_user_meta_data->>'referral_code')
  );

  insert into wallets (user_id, balance) values (new.id, 0);

  -- build multi-level referral edges (direct + up to 3 levels up the chain)
  if new.raw_user_meta_data->>'referral_code' is not null then
    select * into referrer from profiles where referral_code = new.raw_user_meta_data->>'referral_code';
    if found then
      insert into referrals (referrer_id, referred_id, level) values (referrer.id, new.id, 1);

      lvl := 2;
      current_upline := referrer.referred_by;
      while current_upline is not null and lvl <= 3 loop
        insert into referrals (referrer_id, referred_id, level) values (current_upline, new.id, lvl)
        on conflict do nothing;
        select referred_by into current_upline from profiles where id = current_upline;
        lvl := lvl + 1;
      end loop;
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================
-- RPC: APPROVE DEPOSIT (admin) — credits wallet + logs transaction
-- =========================================================
create or replace function approve_deposit(deposit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d deposits;
begin
  if not is_admin() then
    raise exception 'Only admins can approve deposits';
  end if;

  select * into d from deposits where id = deposit_id and status = 'pending';
  if not found then
    raise exception 'Deposit not found or already reviewed';
  end if;

  update deposits set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = deposit_id;

  update wallets set balance = balance + d.amount, updated_at = now() where user_id = d.user_id;

  insert into transactions (user_id, type, amount, status, reference, note)
  values (d.user_id, 'deposit', d.amount, 'completed', d.payment_reference, 'Deposit approved');
end;
$$;

-- =========================================================
-- RPC: REJECT DEPOSIT (admin)
-- =========================================================
create or replace function reject_deposit(deposit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only admins can reject deposits';
  end if;

  update deposits set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = deposit_id and status = 'pending';
end;
$$;

-- =========================================================
-- RPC: REQUEST WITHDRAWAL (investor) — holds funds by debiting immediately,
-- refunded automatically if rejected
-- =========================================================
create or replace function request_withdrawal(p_amount numeric, p_method text, p_details text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  w wallets;
  new_id uuid;
begin
  select * into w from wallets where user_id = auth.uid();
  if w.balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  update wallets set balance = balance - p_amount, updated_at = now() where user_id = auth.uid();

  insert into withdrawals (user_id, amount, payout_method, payout_details, status)
  values (auth.uid(), p_amount, p_method, p_details, 'pending')
  returning id into new_id;

  insert into transactions (user_id, type, amount, status, note)
  values (auth.uid(), 'withdrawal', p_amount, 'pending', 'Withdrawal requested');

  return new_id;
end;
$$;

-- =========================================================
-- RPC: APPROVE WITHDRAWAL (admin) — funds already held, just confirm
-- =========================================================
create or replace function approve_withdrawal(withdrawal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w withdrawals;
begin
  if not is_admin() then
    raise exception 'Only admins can approve withdrawals';
  end if;

  select * into w from withdrawals where id = withdrawal_id and status = 'pending';
  if not found then
    raise exception 'Withdrawal not found or already reviewed';
  end if;

  update withdrawals set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = withdrawal_id;

  update transactions set status = 'completed'
    where user_id = w.user_id and type = 'withdrawal' and status = 'pending' and amount = w.amount;
end;
$$;

-- =========================================================
-- RPC: REJECT WITHDRAWAL (admin) — refund held balance
-- =========================================================
create or replace function reject_withdrawal(withdrawal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w withdrawals;
begin
  if not is_admin() then
    raise exception 'Only admins can reject withdrawals';
  end if;

  select * into w from withdrawals where id = withdrawal_id and status = 'pending';
  if not found then
    raise exception 'Withdrawal not found or already reviewed';
  end if;

  update withdrawals set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    where id = withdrawal_id;

  update wallets set balance = balance + w.amount, updated_at = now() where user_id = w.user_id;

  update transactions set status = 'failed'
    where user_id = w.user_id and type = 'withdrawal' and status = 'pending' and amount = w.amount;
end;
$$;

-- =========================================================
-- RPC: INVEST IN A PLAN — debits wallet, creates investment,
-- pays multi-level referral commissions up the chain
-- =========================================================
create or replace function invest_in_plan(p_plan_id uuid, p_amount numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  plan investment_plans;
  w wallets;
  new_id uuid;
  ref record;
  rate numeric;
  commission numeric;
begin
  select * into plan from investment_plans where id = p_plan_id and is_active = true;
  if not found then
    raise exception 'Investment plan not available';
  end if;

  if p_amount < plan.min_amount or p_amount > plan.max_amount then
    raise exception 'Amount outside plan limits';
  end if;

  select * into w from wallets where user_id = auth.uid();
  if w.balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  update wallets set balance = balance - p_amount, updated_at = now() where user_id = auth.uid();

  insert into investments (user_id, plan_id, amount, expected_return, matures_at)
  values (
    auth.uid(), p_plan_id, p_amount,
    p_amount + (p_amount * plan.roi_percent / 100),
    now() + (plan.duration_days || ' days')::interval
  )
  returning id into new_id;

  insert into transactions (user_id, type, amount, status, note)
  values (auth.uid(), 'investment', p_amount, 'completed', 'Invested in ' || plan.name);

  -- pay multi-level referral commissions up the chain
  for ref in select referrer_id, level from referrals where referred_id = auth.uid()
  loop
    select percent into rate from referral_levels where level = ref.level;
    if rate is not null then
      commission := p_amount * rate / 100;
      update wallets set balance = balance + commission, updated_at = now() where user_id = ref.referrer_id;
      insert into transactions (user_id, type, amount, status, note)
      values (ref.referrer_id, 'referral_commission', commission, 'completed',
        'Level ' || ref.level || ' referral commission');
    end if;
  end loop;

  return new_id;
end;
$$;

-- =========================================================
-- RPC: COMPLETE MATURED INVESTMENTS (run on a schedule / by admin)
-- Pays out ROI to matured, still-active investments
-- =========================================================
create or replace function complete_matured_investments()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  count_done int := 0;
begin
  if not is_admin() then
    raise exception 'Only admins can run payouts';
  end if;

  for inv in select * from investments where status = 'active' and matures_at <= now()
  loop
    update investments set status = 'completed', completed_at = now() where id = inv.id;
    update wallets set balance = balance + inv.expected_return, updated_at = now() where user_id = inv.user_id;
    insert into transactions (user_id, type, amount, status, note)
    values (inv.user_id, 'roi_payout', inv.expected_return, 'completed', 'Investment matured');
    count_done := count_done + 1;
  end loop;

  return count_done;
end;
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table wallets enable row level security;
alter table investment_plans enable row level security;
alter table investments enable row level security;
alter table transactions enable row level security;
alter table deposits enable row level security;
alter table withdrawals enable row level security;
alter table referrals enable row level security;
alter table referral_levels enable row level security;
alter table kyc_submissions enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or is_admin());

-- wallets — never writable directly by users; only via RPC (security definer)
create policy "wallets_select_own_or_admin" on wallets for select
  using (user_id = auth.uid() or is_admin());

-- investment_plans — everyone can read active plans, only admin manages
create policy "plans_select_all" on investment_plans for select using (true);
create policy "plans_admin_write" on investment_plans for insert with check (is_admin());
create policy "plans_admin_update" on investment_plans for update using (is_admin());
create policy "plans_admin_delete" on investment_plans for delete using (is_admin());

-- investments
create policy "investments_select_own_or_admin" on investments for select
  using (user_id = auth.uid() or is_admin());

-- transactions
create policy "transactions_select_own_or_admin" on transactions for select
  using (user_id = auth.uid() or is_admin());

-- deposits
create policy "deposits_select_own_or_admin" on deposits for select
  using (user_id = auth.uid() or is_admin());
create policy "deposits_insert_own" on deposits for insert
  with check (user_id = auth.uid());
create policy "deposits_admin_update" on deposits for update using (is_admin());

-- withdrawals
create policy "withdrawals_select_own_or_admin" on withdrawals for select
  using (user_id = auth.uid() or is_admin());
create policy "withdrawals_admin_update" on withdrawals for update using (is_admin());

-- referrals
create policy "referrals_select_own_or_admin" on referrals for select
  using (referrer_id = auth.uid() or referred_id = auth.uid() or is_admin());

-- referral_levels — public read, admin write
create policy "referral_levels_select_all" on referral_levels for select using (true);
create policy "referral_levels_admin_write" on referral_levels for update using (is_admin());

-- kyc_submissions
create policy "kyc_select_own_or_admin" on kyc_submissions for select
  using (user_id = auth.uid() or is_admin());
create policy "kyc_insert_own" on kyc_submissions for insert
  with check (user_id = auth.uid());
create policy "kyc_admin_update" on kyc_submissions for update using (is_admin());

-- =========================================================
-- STORAGE — bucket for KYC ID images and deposit proofs (private)
-- =========================================================
insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do nothing;

create policy "kyc_docs_own_upload" on storage.objects for insert
  with check (bucket_id = 'kyc-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "kyc_docs_own_or_admin_read" on storage.objects for select
  using (bucket_id = 'kyc-documents' and ((storage.foldername(name))[1] = auth.uid()::text or is_admin()));

-- =========================================================
-- SEED: a couple of starter plans (edit/remove as needed)
-- =========================================================
insert into investment_plans (name, description, min_amount, max_amount, roi_percent, duration_days)
values
  ('Starter', 'A low-risk entry plan for first-time investors.', 100, 999, 10, 30),
  ('Growth', 'Balanced plan for steady mid-term growth.', 1000, 4999, 18, 45),
  ('Premium', 'Our highest-yield plan for experienced investors.', 5000, 50000, 30, 60);

-- =========================================================
-- NOTE: to make a user an admin, run manually after they sign up:
-- update profiles set role = 'admin' where email = 'admin@example.com';
-- =========================================================
