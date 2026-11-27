begin;

create schema if not exists yotion;

create table yotion.paid_orders (
    stripe_session_id text primary key,
    order_reference uuid not null default gen_random_uuid() unique,
    stripe_subscription_id text not null,
    customer_email text not null,
    plan text not null check (plan in ('essential', 'managed')),
    amount_paid integer not null check (
        (plan = 'essential' and amount_paid = 9900) or
        (plan = 'managed' and amount_paid = 3999)
    ),
    created_at timestamptz not null default now()
);

alter table yotion.paid_orders enable row level security;
revoke all on yotion.paid_orders from public, anon, authenticated;

create function public.yotion_record_paid_order(
    p_session_id text, p_subscription_id text, p_email text,
    p_plan text, p_amount integer
) returns void
language sql security definer set search_path = ''
as $$
    insert into yotion.paid_orders (
        stripe_session_id, stripe_subscription_id, customer_email, plan, amount_paid
    )
    values (p_session_id, p_subscription_id, p_email, p_plan, p_amount)
    on conflict (stripe_session_id) do nothing;
$$;

create function public.yotion_get_paid_order(p_session_id text)
returns table(order_reference uuid, plan text, amount_paid integer)
language sql stable security definer set search_path = ''
as $$
    select o.order_reference, o.plan, o.amount_paid
    from yotion.paid_orders o
    where o.stripe_session_id = p_session_id;
$$;

revoke all on function public.yotion_record_paid_order(text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.yotion_get_paid_order(text) from public, anon, authenticated;
grant execute on function public.yotion_record_paid_order(text, text, text, text, integer) to service_role;
grant execute on function public.yotion_get_paid_order(text) to service_role;

commit;
