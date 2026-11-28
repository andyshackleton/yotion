import { itinerarySteps, itineraryTasks, readItinerary, taskOwner, taskStatus } from "../../../lib/yotion-order-itinerary";
import { briefSections } from "../../../lib/yotion-website-brief";
import { orderMessages, renderOrderMessages } from "../../../lib/yotion-order-messages";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "../../../lib/yotion-admin-auth";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { db } from "../../../lib/yotion-db";
import { sendOrderEmail } from "../../../lib/yotion-order-email";
import { escapeOrderHtml as esc, money, orderPlan, orderToken } from "../../../lib/yotion-order-progress";

export const dynamic = "force-dynamic";

function render(body: string, status = 200) {
  return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
  <link rel="icon" href="/yotion-admin-icon.svg"><meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><title>Paid orders | Yotion Admin</title><style>
  :root{--ink:#172e2b;--green:#175e4c;--paper:#f6f8f3;--line:#dce6dd;--muted:#465d51}
  *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.55 Arial,sans-serif}
  a{color:var(--green);text-underline-offset:3px}button,input,select,textarea{font:inherit}
  :focus-visible{outline:3px solid #37836d;outline-offset:3px}button{cursor:pointer}
  .shell{display:grid;grid-template-columns:14rem minmax(0,1fr);min-height:100vh}
  .sidebar{background:#203a34;color:#f4f8f1;padding:1.3rem 1rem;display:flex;flex-direction:column;gap:1.5rem}
  .brand{display:flex;align-items:center;gap:.65rem;font-weight:700;font-size:1.15rem;padding:.25rem .55rem}.brand img{flex:none}
  .sidebar nav{display:grid;gap:.3rem}.sidebar nav a{padding:.55rem .7rem;color:inherit;text-decoration:none;border-radius:6px}
  .sidebar nav a[aria-current]{color:#172e2b;background:#cfe77a;font-weight:700}.sidebar nav a:hover{text-decoration:underline}
  .sidebar form{margin-top:auto}.sidebar button{background:transparent;color:inherit;border:1px solid #afc5b8}
  main{width:min(100%,80rem);padding:clamp(1.1rem,4vw,3rem);margin:0 auto}
  h1,h2,h3{font-weight:500;line-height:1.2;letter-spacing:-.025em;margin:0}h1{font-size:clamp(2rem,6vw,3rem)}h2{font-size:1.3rem}h3{font-size:1.1rem}
  .intro{color:var(--muted);margin:.55rem 0 1.7rem}
  .views{display:flex;gap:1.25rem;border-bottom:1px solid var(--line);margin-bottom:1rem}
  .views a{padding:.45rem 0 .7rem;text-decoration:none;border-bottom:3px solid transparent;font-size:.94rem}
  .views a[aria-current]{font-weight:700;border-color:var(--green)}
  .list{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:white}
  .row,.columns{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,.95fr) minmax(0,.6fr);gap:.75rem;align-items:center;padding:.9rem 1.15rem}
  .columns{background:#edf3e9;color:#345048;font-size:.86rem;font-weight:700}
  .order+.order{border-top:1px solid var(--line)}.row{cursor:pointer;list-style:none}
  .row::-webkit-details-marker{display:none}.row:hover,.order[open]>.row{background:#f5f8f1}
  .customer{display:flex;gap:.65rem;align-items:center;min-width:0}.indicator{border:solid var(--green);border-width:0 2px 2px 0;width:7px;height:7px;transform:rotate(-45deg);flex:none;margin-right:.15rem}
  .order[open] .indicator{transform:rotate(45deg)}.customer strong,.customer small,.plan small,.date small{display:block;overflow-wrap:anywhere}
  .customer small,.plan small,.date small,.metadata{color:var(--muted);font-size:.85rem}
  .badge{display:inline-block;width:fit-content;padding:.22rem .5rem;border-radius:5px;font-size:.82rem;font-weight:700;background:#eaf0e8;color:#274a3b}
  .badge.wait{background:#f6efdc;color:#613d14}.badge.blocked{background:#fae6e1;color:#792f23}
  .order-body{padding:1.15rem clamp(1rem,3vw,1.6rem);border-top:1px solid var(--line)}
  .metadata{overflow-wrap:anywhere;margin:0 0 1.1rem}.order-content{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
  .pane{border:1px solid var(--line);border-radius:8px;padding:1rem;min-width:0}.pane h3{margin:0 0 .65rem}
  .pane details{border-top:1px solid var(--line);padding:.55rem 0}.pane summary{cursor:pointer;font-weight:700}
  .pane p{margin:.35rem 0 .65rem}.pane .metadata{margin-bottom:.5rem}
  dl{margin:.45rem 0 0}dt{font-size:.88rem;font-weight:700}dd{margin:0 0 .6rem;overflow-wrap:anywhere;white-space:pre-wrap}
  .actions{display:flex;gap:.5rem;flex-wrap:wrap}.actions:empty{display:none}
  button{padding:.45rem .75rem;border:1px solid var(--green);border-radius:6px;color:white;background:var(--green);font:400 15px Arial,sans-serif}
  button:hover{filter:brightness(.93)}
  .task-edit,.reply{display:grid;gap:.4rem;margin:.65rem 0}.task-edit{border:1px solid var(--line);border-radius:6px}
  .task-edit legend{font-weight:700}.task-edit button,.reply button{justify-self:start;margin-top:.25rem}
  select,input,textarea{min-width:0;width:100%;border:1px solid #8ba295;border-radius:5px;padding:.45rem;color:var(--ink);background:#fff}
  textarea{min-height:5rem;resize:vertical}.reply label,.task-edit label{font-size:.9rem}
  .order-messages{list-style:none;padding:0}.order-messages li{border-bottom:1px solid var(--line);padding:.55rem 0}.order-messages time{display:block;font-size:.85rem;color:var(--muted)}.order-messages p{white-space:pre-wrap;overflow-wrap:anywhere}
  .empty{padding:clamp(1rem,4vw,2rem);background:white;border:1px solid var(--line);border-radius:12px}.empty p{margin:.5rem 0 0;color:var(--muted)}
  .notice{padding:.65rem .85rem;background:#edf3e9;border-left:3px solid var(--green)}
  @media(max-width:900px){.shell{grid-template-columns:11rem minmax(0,1fr)}.row,.columns{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,.9fr)}.date{grid-column:2/-1}.columns .date{display:none}}
  @media(max-width:650px){.shell{display:block}.sidebar{padding:.7rem 1rem;gap:.5rem}.sidebar nav{display:flex;flex-wrap:wrap}.sidebar form{margin-top:0}.row{grid-template-columns:1fr 1fr}.customer{grid-column:1/-1}.date{grid-column:auto}.columns{display:none}.order-content{grid-template-columns:1fr}}
  </style></head><body><div class="shell"><aside class="sidebar">
  <div class="brand"><img src="/yotion-admin-icon.svg" alt="" width="28" height="28">Yotion Admin</div>
  <nav aria-label="Admin navigation"><a href="/admin/orders" aria-current="page">Paid orders</a><a href="/admin/demo-requests">Demo requests</a></nav>
  <form method="post" action="/admin/logout"><button type="submit">Sign out</button></form>
  </aside><main><h1>Paid orders</h1>${body}</main></div></body></html>`, {
    status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY" },
  });
}

const displayDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });

const domainLabels: Record<string, string> = { owned: "Already owns a domain", register: "Needs to register one", help: "Would like help choosing one" };

export async function GET(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.redirect(new URL("/admin/login", request.url));
  const { data, error } = await db().rpc("yotion_admin_paid_orders");
  if (error) return render("<p>Paid orders could not be loaded.</p>", 503);
  const result = request.nextUrl.searchParams.get("result");
  const message = result === "message" ? "Reply posted." : result === "updated" ? "Task updated." : result === "email"
    ? "Email retry processed. Check the email status below." : result === "failed" ? "The update did not complete. Please try again." : "";
  const isTest = (order: Record<string, unknown>) => String(order.stripe_session_id).startsWith("cs_test_");
  const viewTest = request.nextUrl.searchParams.get("view") === "test";
  const expanded = request.nextUrl.searchParams.get("order");
  const testCount = (data ?? []).filter(isTest).length;
  const liveCount = (data ?? []).length - testCount;
  const orders = await Promise.all((data ?? []).filter((order: Record<string, unknown>) => isTest(order) === viewTest)
    .map(async (order: Record<string, unknown>) => {
    const reference = esc(order.order_reference);
    const submitted = Boolean(order.submitted_at);
    const details = (order.details ?? {}) as Record<string, unknown>;
    const summary = briefSections.map(section => {
      const items = section.fields.filter(field => details[field.key]).map(field =>
        `<dt>${field.label}</dt><dd>${esc(details[field.key])}</dd>`).join("");
      const domain = section.id === "branding" && details.domain_status
        ? `<dt>Domain plans</dt><dd>${esc(domainLabels[String(details.domain_status)] ?? details.domain_status)}</dd>` : "";
      return items || domain ? `<details><summary>${section.title}</summary><dl>${items}${domain}</dl></details>` : "";
    }).join("");
    const itinerary = submitted ? await readItinerary(null, String(order.order_reference)) : null;
    const tasks = itinerary ? itineraryTasks(itinerary.tasks, order.progress_status) : [];
    const stage = !submitted ? "Awaiting details" : tasks.some(task => task.status === "blocked") ? "Blocked" :
      tasks.every(task => task.status === "complete") ? "Launched" : tasks.some(task => task.task === "review" && task.status === "active") ?
        "Ready for review" : tasks.some(task => task.status === "active") ? "In progress" : "Details received";
    const stageClass = stage === "Blocked" ? "blocked" : !submitted ? "wait" : "";
    const controls = itinerary ? `<details><summary>Launch tasks</summary>
      ${tasks.map(task => {
        const id = `${reference}-${task.task}`;
        return `<form method="post"><input type="hidden" name="reference" value="${reference}"><input type="hidden" name="task" value="${task.task}">
          <fieldset class="task-edit"><legend>${task.title}</legend>
          <label for="status-${id}">Status</label><select id="status-${id}" name="status">
          ${Object.entries(taskStatus).map(([key,label]) => `<option value="${key}"${task.status === key ? " selected" : ""}>${label}</option>`).join("")}</select>
          <label for="owner-${id}">Owner</label><select id="owner-${id}" name="owner">
          ${Object.entries(taskOwner).map(([key,label]) => `<option value="${key}"${task.owner === key ? " selected" : ""}>${key === "customer" ? "Customer" : label}</option>`).join("")}</select>
          <label for="date-${id}">Planned date and time (UK)</label><input id="date-${id}" name="due" type="datetime-local" value="${esc(task.due_at?.slice(0,16))}">
          <label for="note-${id}">Customer-facing update or blocker reason</label><textarea id="note-${id}" name="note" maxlength="1500">${esc(task.note)}</textarea>
          <button name="action" value="task">Save task</button></fieldset></form>`;
      }).join("")}</details>` : "";
    const retries = `<form method="post" class="actions"><input type="hidden" name="reference" value="${reference}">
      ${order.welcome_sent_at ? "" : '<button name="action" value="welcome">Retry welcome email</button>'}
      ${submitted && !order.progress_sent_at ? '<button name="action" value="progress">Retry progress email</button>' : ""}</form>`;
    const messages = submitted ? `<details><summary>Order messages</summary>
      ${renderOrderMessages(await orderMessages(null, String(order.order_reference)), "Customer")}
      <form method="post" class="reply"><input type="hidden" name="reference" value="${reference}">
      <label for="message-${reference}">Reply to customer</label>
      <textarea id="message-${reference}" name="message" maxlength="2000" required></textarea>
      <button name="action" value="message">Post reply</button></form></details>` : "";
    const date = new Date(String(order.created_at ?? ""));
    const when = Number.isNaN(date.getTime()) ? "—" : displayDate.format(date);
    return `<details class="order" id="order-${reference}"${expanded === order.order_reference ? " open" : ""}>
      <summary class="row">
        <span class="customer"><span class="indicator" aria-hidden="true"></span><span><strong>${esc(details.school || "School name pending")}</strong><small>${esc(order.customer_email)}</small></span></span>
        <span class="plan">${orderPlan(String(order.plan))}<small>${money(Number(order.amount_paid))} paid</small></span>
        <span class="badge ${stageClass}">${stage}</span><span class="date"><small>${when}</small></span>
      </summary><div class="order-body">
        <p class="metadata">Order reference · ${reference}</p>
        <div class="order-content">
          <section class="pane"><h3>Website brief</h3>${submitted ? summary || "<p>No brief details available.</p>" : "<p>Waiting for the customer to submit their website details.</p>"}</section>
          <section class="pane"><h3>Order activity</h3>
            ${controls}${messages}
            <details><summary>Email delivery</summary>
              <p class="metadata">Welcome · ${order.welcome_sent_at ? "Sent" : "Not sent"}<br>Progress · ${order.progress_sent_at ? "Sent" : "Not sent"}</p>
              ${retries}
            </details>
          </section>
        </div>
      </div></details>`;
  }));
  const liveHref = '/admin/orders';
  return render(`<p class="intro">${viewTest ? "Orders placed with Stripe test cards. No money was collected." : "Review paid orders and manage each customer’s website launch."}</p>
    <nav class="views" aria-label="Order views">
      <a href="${liveHref}"${!viewTest ? ' aria-current="page"' : ""}>Orders (${liveCount})</a>
      <a href="${liveHref}?view=test"${viewTest ? ' aria-current="page"' : ""}>Test orders (${testCount})</a>
    </nav>
    ${message ? `<p class="notice" role="status">${message}</p>` : ""}
    ${orders.length ? `<section class="list" aria-label="${viewTest ? "Test orders" : "Customer orders"}">
      <div class="columns" aria-hidden="true"><span>Customer</span><span>Plan</span><span>Launch status</span><span class="date">Order placed</span></div>
      ${orders.join("")}</section>` : `<section class="empty"><h2>${viewTest ? "No test orders yet" : "No paid orders yet"}</h2>
      <p>${viewTest ? "Orders from Stripe test checkouts will appear here." : "New customer purchases will appear here as soon as Stripe confirms payment."}</p></section>`}`);

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
    if (action === "task") {
      const task = String(form.get("task") ?? "");
      const status = String(form.get("status") ?? "");
      const owner = String(form.get("owner") ?? "");
      const due = String(form.get("due") ?? "");
      const note = String(form.get("note") ?? "").trim();
      if (!Object.hasOwn(itinerarySteps, task) || !Object.hasOwn(taskStatus, status) ||
          !Object.hasOwn(taskOwner, owner) || (due && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(due)) ||
          note.length > 1500 || (status === "blocked" && !note)) {
        return render('<p>Check the task details. A blocked task needs a customer-facing reason.</p><a href="/admin/orders">Back to paid orders</a>', 400);
      }
      const { data, error } = await client.rpc("yotion_update_order_task", {
        p_reference: reference, p_task: task, p_status: status, p_owner: owner, p_due_at: due || null, p_note: note,
      });
      if (error || !data) throw new Error("Task update failed");
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
  const destination = new URL("/admin/orders", request.url);
  destination.searchParams.set("result", result);
  destination.searchParams.set("order", reference);
  if (request.nextUrl.searchParams.get("view") === "test") destination.searchParams.set("view", "test");
  destination.hash = "order-" + reference;
  return NextResponse.redirect(destination, 303);
}
