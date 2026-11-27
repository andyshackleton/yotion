begin;
create table yotion.order_messages (
    id bigint generated always as identity primary key,
    access_token uuid not null references yotion.order_setup(access_token),
    sender text not null check (sender in ('customer', 'yotion')),
    message text not null check (char_length(message) between 1 and 2000),
    sent_at timestamptz not null default now()
);
create index on yotion.order_messages(access_token, id);
alter table yotion.order_messages enable row level security;
revoke all on yotion.order_messages from public, anon, authenticated;

create function public.yotion_order_messages(p_token uuid, p_reference uuid, p_message text default null)
returns table(sender text, message text, sent_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare target uuid;
begin
    select s.access_token into target
    from yotion.order_setup s join yotion.paid_orders o using (stripe_session_id)
    where s.submitted_at is not null and
      ((p_token is not null and p_reference is null and s.access_token = p_token) or
       (p_token is null and p_reference is not null and o.order_reference = p_reference));
    if target is null then return; end if;
    if p_message is not null then
        insert into yotion.order_messages(access_token, sender, message)
        values(target, case when p_token is null then 'yotion' else 'customer' end, p_message);
    end if;
    return query select m.sender, m.message, m.sent_at from yotion.order_messages m
    where m.access_token = target order by m.id;
end;
$$;
revoke all on function public.yotion_order_messages(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.yotion_order_messages(uuid, uuid, text) to service_role;
commit;
