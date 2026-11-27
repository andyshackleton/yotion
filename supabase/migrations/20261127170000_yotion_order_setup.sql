begin;

create table yotion.order_setup (
    stripe_session_id text primary key references yotion.paid_orders(stripe_session_id),
    access_token uuid not null default gen_random_uuid() unique,
    details jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    submitted_at timestamptz
);

alter table yotion.order_setup enable row level security;
revoke all on yotion.order_setup from public, anon, authenticated;

create function public.yotion_start_order_setup(p_session text)
returns uuid language plpgsql security definer set search_path = ''
as $$
begin
    insert into yotion.order_setup (stripe_session_id)
    select stripe_session_id from yotion.paid_orders where stripe_session_id = p_session
    on conflict (stripe_session_id) do nothing;
    return (select access_token from yotion.order_setup where stripe_session_id = p_session);
end;
$$;

create function public.yotion_read_order_setup(p_token uuid)
returns table(order_reference uuid, details jsonb, submitted_at timestamptz)
language sql stable security definer set search_path = ''
as $$
    select o.order_reference, s.details, s.submitted_at
    from yotion.order_setup s
    join yotion.paid_orders o using (stripe_session_id)
    where s.access_token = p_token;
$$;

create function public.yotion_save_order_setup(p_token uuid, p_details jsonb, p_submit boolean)
returns boolean language sql security definer set search_path = ''
as $$
    with saved as (
        update yotion.order_setup
        set details = p_details, updated_at = now(),
            submitted_at = case when p_submit then now() else null end
        where access_token = p_token and submitted_at is null
        returning 1
    )
    select exists (select from saved);
$$;

revoke all on function public.yotion_start_order_setup(text),
    public.yotion_read_order_setup(uuid), public.yotion_save_order_setup(uuid, jsonb, boolean)
    from public, anon, authenticated;
grant execute on function public.yotion_start_order_setup(text),
    public.yotion_read_order_setup(uuid), public.yotion_save_order_setup(uuid, jsonb, boolean)
    to service_role;

commit;
