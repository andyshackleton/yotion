begin;

alter table yotion.paid_orders
    drop constraint paid_orders_check,
    add constraint paid_orders_check check (
        (plan = 'essential' and amount_paid in (9900, 9999)) or
        (plan = 'managed' and amount_paid = 3999)
    );

commit;
