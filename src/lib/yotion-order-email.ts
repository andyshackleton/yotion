import { db } from "./yotion-db";
import { money, orderPlan, orderRenewal, orderToken } from "./yotion-order-progress";

type EmailKind = "welcome" | "progress";

export async function sendOrderEmail(kind: EmailKind, identifier: { session: string } | { token: string }) {
  const client = db();
  if ("session" in identifier) {
    const { error } = await client.rpc("yotion_start_order_setup", { p_session: identifier.session });
    if (error) throw error;
  }
  const { data, error } = await client.rpc("yotion_order_email", {
    p_session: "session" in identifier ? identifier.session : null,
    p_token: "token" in identifier ? identifier.token : null,
  });
  if (error) throw error;
  const order = data?.[0];
  if (!order || !orderToken.test(order.access_token)) throw new Error("Order email details unavailable");

  const sentAt = kind === "welcome" ? order.welcome_sent_at : order.progress_sent_at;
  if (sentAt || (kind === "progress" && !order.submitted_at)) return;

  // Keep sandbox emails within an explicitly chosen test inbox.
  if (order.stripe_session_id.startsWith("cs_test_") &&
      order.customer_email.toLowerCase() !== process.env.YOTION_ORDER_TEST_EMAIL?.trim().toLowerCase()) return;

  const key = process.env.RESEND_API_KEY;
  const from = process.env.YOTION_FROM_EMAIL;
  if (!key || !from) throw new Error("Order email is not configured");
  const page = kind === "welcome" ? "setup" : "progress";
  const link = `https://yotion.co.uk/order/${page}?key=${encodeURIComponent(order.access_token)}`;
  const subject = kind === "welcome" ? "Welcome to Yotion — your order is confirmed" : "We’ve received your Yotion website details";
  const summary = `Order reference: ${order.order_reference}\nPlan: ${orderPlan(order.plan)}\nPaid today: ${money(order.amount_paid)}`;
  const renewal = `Renews automatically at ${orderRenewal(order.plan, order.amount_paid)}.`;
  const text = kind === "welcome"
    ? `Thank you for choosing Yotion. Your order is confirmed.\n\n${summary}\n${renewal}\n\nStart or resume your website setup:\n${link}\n\nKeep this link private. You can save your progress and come back when you’re ready.`
    : `Thank you for sending your school details. We’ll review them and prepare your website. You’ll be able to review it before it goes live.\n\nOrder reference: ${order.order_reference}\n\nView your website progress:\n${link}\n\nKeep this link private.`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `yotion-order/${kind}/${order.order_reference}`,
    },
    body: JSON.stringify({ from, to: [order.customer_email], reply_to: "hello@yotion.co.uk", subject, text }),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Order email provider returned ${response.status}`);
  const marked = await client.rpc("yotion_mark_order_email_sent", { p_token: order.access_token, p_kind: kind });
  if (marked.error) throw marked.error;
}
