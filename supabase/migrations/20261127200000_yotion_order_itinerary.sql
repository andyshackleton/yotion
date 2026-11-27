begin;

create table yotion.order_task_updates (
    id bigint generated always as identity primary key,
    access_token uuid not null references yotion.order_setup(access_token),
    task text not null check (task in ('prepare', 'review', 'launch')),
    status text not null check (status in ('upcoming', 'active', 'blocked', 'complete')),
    owner text not null check (owner in ('yotion', 'customer')),
    due_at timestamp,
    note text not null check (length(note) <= 1500 and (status <> 'blocked' or length(btrim(note)) > 0)),
    created_at timestamptz not null default now()
);

create index on yotion.order_task_updates(access_token, task, id desc);
alter table yotion.order_task_updates enable row level security;
revoke all on yotion.order_task_updates from public, anon, authenticated;

create function public.yotion_read_order_itinerary(p_token uuid, p_reference uuid)
returns jsonb language sql stable security definer set search_path = ''
as $$
    select jsonb_build_object('paid_at', o.created_at, 'submitted_at', s.submitted_at,
      'updates', coalesce((
        select jsonb_agg(to_jsonb(u) - 'access_token' order by u.id desc)
        from (select * from yotion.order_task_updates
              where access_token = s.access_token order by id desc limit 100) u
      ), '[]'::jsonb),
      'tasks', coalesce((
        select jsonb_agg(to_jsonb(t) - 'access_token')
        from (select distinct on (task) * from yotion.order_task_updates
              where access_token = s.access_token order by task, id desc) t
      ), '[]'::jsonb))
    from yotion.order_setup s join yotion.paid_orders o using (stripe_session_id)
    where s.submitted_at is not null and (
      (p_token is not null and p_reference is null and s.access_token = p_token) or
      (p_token is null and p_reference is not null and o.order_reference = p_reference)
    );
$$;

create function public.yotion_update_order_task(
    p_reference uuid, p_task text, p_status text, p_owner text, p_due_at timestamp, p_note text
) returns boolean language plpgsql security definer set search_path = ''
as $$
declare target uuid;
begin
    select s.access_token into target
    from yotion.order_setup s join yotion.paid_orders o using (stripe_session_id)
    where o.order_reference = p_reference and s.submitted_at is not null
    for update of s;
    if target is null then return false; end if;
    if exists (
        select from (select status, owner, due_at, note from yotion.order_task_updates
        where access_token = target and task = p_task order by id desc limit 1) current_task
        where (status, owner, due_at, note) is not distinct from (p_status, p_owner, p_due_at, p_note)
    ) then return true; end if;
    insert into yotion.order_task_updates(access_token, task, status, owner, due_at, note)
    values(target, p_task, p_status, p_owner, p_due_at, p_note);
    return true;
end;
$$;
revoke all on function public.yotion_read_order_itinerary(uuid, uuid),
    public.yotion_update_order_task(uuid, text, text, text, timestamp, text)
    from public, anon, authenticated;
grant execute on function public.yotion_read_order_itinerary(uuid, uuid),
    public.yotion_update_order_task(uuid, text, text, text, timestamp, text)
    to service_role;
commit;
