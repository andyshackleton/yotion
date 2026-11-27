import { briefSections } from "../../../lib/yotion-website-brief";
import { orderMessages, renderOrderMessages } from "../../../lib/yotion-order-messages";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../../lib/yotion-admin-auth";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { db } from "../../../lib/yotion-db";
import { sendOrderEmail } from "../../../lib/yotion-order-email";
import { escapeOrderHtml as esc, money, orderPlan, orderStatus, orderToken } from "../../../lib/yotion-order-progress";

export const dynamic = "force-dynamic";

function render(body: string, status = 200) {
  return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Paid orders | Yotion Admin</title><style>
  body{margin:0;background:#f7f9f5;color:#172e2b;font:16px/1.5 Arial,sans-serif}main{max-width:62rem;margin:auto;padding:2rem 1rem}a{color:#175e4c}article{background:white;border:1px solid #dfe7da;border-radius:12px;padding:1rem 1.25rem;margin:1rem 0}h2{margin:0;font-size:1.25rem}dd{margin:0 0 .5rem;overflow-wrap:anywhere;white-space:pre-wrap}dt{font-weight:700}form{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin:.75rem 0}button,select{font:inherit;padding:.4rem}.test{background:#eef3e6;padding:.2rem .4rem;border-radius:4px}
  </style></head><body><main><a href="/admin">Back to Yotion Admin</a><h1>Paid orders</h1>${body}</main></body></html>`, {
    status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY" },
  });
}

const domainLabels: Record<string, string> = { owned: "Already owns a domain", register: "Needs to register one", help: "Would like help choosing one" };

export async function GET(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.redirect(new URL("/admin/login", request.url));
  const { data, error } = await db().rpc("yotion_admin_paid_orders");
  if (error) return render("<p>Paid orders could not be loaded.</p>", 503);
  const result = request.nextUrl.searchParams.get("result");
  const message = result === "message" ? "Reply posted." : result === "updated" ? "Order status updated." : result === "email"
    ? "Email retry processed. Check the email status below." : result === "failed" ? "The update did not complete. Please try again." : "";
  const orders = (await Promise.all((data ?? []).map(async (order: Record<string, unknown>) => {
    const reference = esc(order.order_reference);
    const test = String(order.stripe_session_id).startsWith("cs_test_");
    const submitted = Boolean(order.submitted_at);
    const details = (order.details ?? {}) as Record<string, unknown>;
    const summary = briefSections.map(section => {
      const items = section.fields.filter(field => details[field.key]).map(field =>
        `<dt>${field.label}</dt><dd>${esc(details[field.key])}</dd>`).join("");
      const domain = section.id === "branding" && details.domain_status
        ? `<dt>Domain plans</dt><dd>${esc(domainLabels[String(details.domain_status)] ?? details.domain_status)}</dd>` : "";
      return items || domain ? `<details><summary>${section.title}</summary><dl>${items}${domain}</dl></details>` : "";
    }).join("");
    const controls = submitted ? `<form method="post"><input type="hidden" name="reference" value="${reference}">
      <label for="status-${reference}">Customer progress</label><select id="status-${reference}" name="status">
      ${Object.entries(orderStatus).map(([key,label]) => `<option value="${key}"${order.progress_status === key ? " selected" : ""}>${label}</option>`).join("")}
      </select><button name="action" value="status">Update status</button></form>` : "";
    const retries = `<form method="post"><input type="hidden" name="reference" value="${reference}">
      ${order.welcome_sent_at ? "" : '<button name="action" value="welcome">Retry welcome email</button>'}
      ${submitted && !order.progress_sent_at ? '<button name="action" value="progress">Retry progress email</button>' : ""}</form>`;
    const messages = submitted ? `<details><summary>Order messages</summary>
      ${renderOrderMessages(await orderMessages(null, String(order.order_reference)), "Customer")}
      <form method="post"><input type="hidden" name="reference" value="${reference}">
      <label for="message-${reference}">Reply to customer</label>
      <textarea id="message-${reference}" name="message" maxlength="2000" required></textarea>
      <button name="action" value="message">Post reply</button></form></details>` : "";
    return `<article><h2>${esc(details.school || orderPlan(String(order.plan)))}</h2>
      <p>${orderPlan(String(order.plan))} · ${money(Number(order.amount_paid))}${test ? ' · <span class="test">Sandbox</span>' : ""}</p>
      <p>${esc(order.customer_email)} · Order ${reference}</p>
      ${submitted ? summary : "<p>Awaiting website details.</p>"}
      <p>Welcome email: ${order.welcome_sent_at ? "Sent" : "Not sent"}. Progress email: ${order.progress_sent_at ? "Sent" : "Not sent"}.</p>
      ${controls}${retries}${messages}</article>`;
  }))).join("");
  return render(`${message ? `<p role="status">${message}</p>` : ""}${orders || "<p>No paid orders yet.</p>"}`);
}

export async function POST(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  if (!isSameOriginPost(request)) return new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const reference = String(form.get("reference") ?? "");
  const action = form.get("action");
  if (!orderToken.test(reference)) return new Response("Invalid order", { status: 400 });
  let result = "failed";
  try {
    const client = db();
    if (action === "status") {
      const { data, error } = await client.rpc("yotion_admin_order_status", {
        p_reference: reference, p_status: String(form.get("status") ?? ""),
      });
      if (error || !data) throw new Error("Order status update failed");
      result = "updated";
    } else if (action === "message") {
      const message = String(form.get("message") ?? "").trim();
      if (!message || message.length > 2000) return render("<p>Enter a message of 2,000 characters or fewer.</p>", 400);
      if (!(await orderMessages(null, reference, message)).length) throw new Error("Order unavailable");
      result = "message";
    } else if (action === "welcome" || action === "progress") {
      const { data, error } = await client.rpc("yotion_admin_paid_orders");
      const order = data?.find((row: { order_reference: string }) => row.order_reference === reference);
      if (error || !order) throw new Error("Order not found");
      await sendOrderEmail(action, { session: order.stripe_session_id });
      result = "email";
    } else {
      return new Response("Invalid action", { status: 400 });
    }
  } catch {
    console.error("Yotion order admin action failed");
  }
  return NextResponse.redirect(new URL("/admin/orders?result=" + result, request.url), 303);
}
