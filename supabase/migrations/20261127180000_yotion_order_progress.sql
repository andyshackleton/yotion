begin;
alter table yotion.order_setup
    add column progress_status text not null default 'received'
        check (progress_status in ('received', 'preparing', 'review')),
    add column welcome_sent_at timestamptz,
    add column progress_sent_at timestamptz;

create function public.yotion_order_email(p_session text, p_token uuid)
returns table(order_reference uuid, stripe_session_id text, access_token uuid, customer_email text,
              plan text, amount_paid integer, submitted_at timestamptz,
              welcome_sent_at timestamptz, progress_sent_at timestamptz)
language sql stable security definer set search_path = ''
as $$
    select o.order_reference, o.stripe_session_id, s.access_token, o.customer_email,
           o.plan, o.amount_paid, s.submitted_at, s.welcome_sent_at, s.progress_sent_at
    from yotion.paid_orders o join yotion.order_setup s using (stripe_session_id)
    where o.stripe_session_id = p_session or s.access_token = p_token;
$$;

create function public.yotion_mark_order_email_sent(p_token uuid, p_kind text)
returns void language sql security definer set search_path = ''
as $$
    update yotion.order_setup
    set welcome_sent_at = case when p_kind = 'welcome' then coalesce(welcome_sent_at, now()) else welcome_sent_at end,
        progress_sent_at = case when p_kind = 'progress' and submitted_at is not null
                                then coalesce(progress_sent_at, now()) else progress_sent_at end
    where access_token = p_token;
$$;

create function public.yotion_read_order_progress(p_token uuid)
returns table(order_reference uuid, plan text, progress_status text, submitted_at timestamptz)
language sql stable security definer set search_path = ''
as $$
    select o.order_reference, o.plan, s.progress_status, s.submitted_at
    from yotion.order_setup s join yotion.paid_orders o using (stripe_session_id)
    where s.access_token = p_token;
$$;

create function public.yotion_admin_paid_orders()
returns table(order_reference uuid, stripe_session_id text, plan text, amount_paid integer,
              customer_email text, created_at timestamptz, details jsonb, submitted_at timestamptz,
              progress_status text, welcome_sent_at timestamptz, progress_sent_at timestamptz)
language sql stable security definer set search_path = ''
as $$
    select o.order_reference, o.stripe_session_id, o.plan, o.amount_paid, o.customer_email,
           o.created_at, s.details, s.submitted_at, s.progress_status, s.welcome_sent_at, s.progress_sent_at
    from yotion.paid_orders o left join yotion.order_setup s using (stripe_session_id)
    order by o.created_at desc;
$$;

create function public.yotion_admin_order_status(p_reference uuid, p_status text)
returns boolean language sql security definer set search_path = ''
as $$
    with changed as (
        update yotion.order_setup s set progress_status = p_status, updated_at = now()
        from yotion.paid_orders o where o.order_reference = p_reference
        and o.stripe_session_id = s.stripe_session_id and s.submitted_at is not null
        and p_status in ('received', 'preparing', 'review')
        returning 1
    )
    select exists (select from changed);
$$;

revoke all on function public.yotion_order_email(text, uuid), public.yotion_mark_order_email_sent(uuid, text),
    public.yotion_read_order_progress(uuid), public.yotion_admin_paid_orders(), public.yotion_admin_order_status(uuid, text)
    from public, anon, authenticated;
grant execute on function public.yotion_order_email(text, uuid), public.yotion_mark_order_email_sent(uuid, text),
    public.yotion_read_order_progress(uuid), public.yotion_admin_paid_orders(), public.yotion_admin_order_status(uuid, text)
    to service_role;
commit;
