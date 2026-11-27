import { itinerarySteps, itineraryTasks, orderDateTime, plannedDateTime, readItinerary, taskOwner, taskStatus } from "../../../lib/yotion-order-itinerary";
import { customerTypography } from "../../../lib/yotion-customer-typography";
import { NextRequest } from "next/server";
import { db } from "../../../lib/yotion-db";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { escapeOrderHtml as esc, orderPlan, orderToken } from "../../../lib/yotion-order-progress";
import { orderMessages, renderOrderMessages } from "../../../lib/yotion-order-messages";

export const dynamic = "force-dynamic";

function render(body: string, status = 200) {
  return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Your website progress | Yotion</title><link rel="icon" href="/yotion-icon.svg"><style>
  *{box-sizing:border-box}body{margin:0;background:#f6f8f2;color:#172e2b;font:16px/1.55 Arial,sans-serif}
  header{background:white;border-bottom:1px solid #dfe7da}header div,main{max-width:68rem;margin:auto;padding-inline:clamp(1rem,4vw,2rem)}header div{display:flex;min-height:4.5rem;align-items:center;justify-content:space-between;gap:1rem}
  a{color:#175e4c;text-underline-offset:3px}.brand{display:inline-flex;align-items:center;gap:.55rem;text-decoration:none;font-size:1.35rem;font-weight:700;color:#172e2b}
  main{padding-block:clamp(2rem,6vw,4rem)}h1{font-size:clamp(2.1rem,6vw,3.45rem);line-height:1.05;letter-spacing:-.045em;margin:0}h2{font-size:1.35rem;margin:0 0 .5rem}
  .reference{color:#465d51;overflow-wrap:anywhere}.overview{background:#203a34;color:white;border-radius:18px;padding:clamp(1.15rem,4vw,1.8rem);margin:1.6rem 0 1rem;display:flex;align-items:center;justify-content:space-between;gap:1rem 2rem;flex-wrap:wrap}
  .overview h2{margin:0}.overview p{margin:.4rem 0 0;color:#e6eee7}.overview .progress-count{color:#172e2b;background:#cfe77a;border-radius:999px;padding:.35rem .8rem;font-size:.875rem;font-weight:700}
  .card{background:white;border:1px solid #dfe7da;border-radius:16px;margin:1rem 0;padding:clamp(1rem,4vw,1.6rem)}
  .tasks,.activity,.order-messages{list-style:none;margin:0;padding:0}.task,.activity li,.order-messages li{border-top:1px solid #dfe7da;padding:.8rem 0}
  .task{display:grid;grid-template-columns:minmax(0,1fr) minmax(12rem,.65fr);gap:.4rem 1rem}
  .task h3{font-size:1.1rem;margin:0}.task p,.activity p,.order-messages p{margin:.3rem 0 0;color:#465d51;white-space:pre-wrap;overflow-wrap:anywhere}
  .task .meta,time,.subtle{font-size:.9rem;color:#465d51}.task .meta{display:grid;gap:.2rem}
  .badge{display:inline-block;width:fit-content;background:#eef3e6;color:#203a34;border-radius:999px;padding:.12rem .55rem;font-size:.85rem;font-weight:700}
  .badge.blocked{background:#fae4df;color:#7f291f}.badge.complete{background:#d9eddf}.badge.active{background:#dcea9c}
  details>summary{cursor:pointer;font-weight:700}.activity,.order-messages{margin-top:.75rem}
  .updates{display:grid;grid-template-columns:1fr 1fr;gap:1rem}.updates .card{margin:0;min-width:0}.order-ref{margin-top:1.2rem;color:#465d51}
  @media(max-width:690px){.updates,.task{grid-template-columns:1fr}}
  form{margin-top:1rem}label{font-weight:700}textarea{display:block;width:100%;margin:.3rem 0 .75rem;resize:vertical;min-height:6rem;border:1px solid #697a70;border-radius:8px;padding:.65rem;font:inherit}
  button,.button{display:inline-block;border:1px solid #172e2b;border-radius:8px;background:#cfe77a;color:#172e2b;padding:.65rem 1rem;font:inherit;cursor:pointer;text-decoration:none}button:hover,.button:hover{background:#e2f39f}:focus-visible{outline:3px solid #175e4c;outline-offset:4px}

  ${customerTypography}
  </style></head><body><header><div><a class="brand" href="/"><img src="/yotion-icon.svg" width="30" height="30" alt="">Yotion</a><a href="mailto:hello@yotion.co.uk">Need help?</a></div></header><main>${body}</main></body></html>`, {
    status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" },
  });
}

const unavailable = () => render("<h1>This progress link is unavailable</h1><p>Use the private link in your Yotion email.</p>", 404);
const failed = () => render("<h1>We couldn’t load your website progress</h1><p>Please try again in a moment.</p>", 503);

async function readOrder(token: string) {
  const { data, error } = await db().rpc("yotion_read_order_progress", { p_token: token });
  if (error) throw error;
  return data?.[0];
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("key") ?? "";
  if (!orderToken.test(token)) return unavailable();
  try {
    const order = await readOrder(token);
    if (!order) return unavailable();
    if (!order.submitted_at) return render(`<h1>Your website setup</h1><p>Send us your website details to get started.</p><a class="button customer-button" href="/order/setup?key=${token}">Continue website setup</a>`);

    const [itinerary, messages] = await Promise.all([readItinerary(token, null), orderMessages(token, null)]);
    const tasks = itineraryTasks(itinerary.tasks, order.progress_status);
    const complete = tasks.filter(task => task.status === "complete").length + 2;
    const incomplete = tasks.filter(task => task.status !== "complete");
    const next = incomplete.find(task => task.status === "blocked" && task.owner === "customer") ??
      incomplete.find(task => task.status === "blocked") ??
      incomplete.find(task => task.status === "active") ?? incomplete[0];
    const rows = tasks.map(task => `<li class="task">
      <div><h3>${task.title}</h3><p>${esc(task.note || task.help)}</p></div>
      <div class="meta"><span class="badge ${task.status}">${taskStatus[task.status]}</span>
      <span>Owner · ${taskOwner[task.owner]}</span>
      <span>${task.due_at ? "Planned · " + plannedDateTime(task.due_at) : "Date to be confirmed"}</span>
      ${task.updated_at ? `<span>${task.status === "complete" ? "Completed" : "Updated"} · ${orderDateTime(task.updated_at)}</span>` : ""}</div></li>`).join("");
    const updates = itinerary.updates.map(update => `<li><strong>${itinerarySteps[update.task].title} · ${taskStatus[update.status]}</strong>
      <br><time datetime="${esc(update.created_at)}">${orderDateTime(update.created_at)}</time>
      <p>Owner · ${taskOwner[update.owner]}${update.due_at ? " · Planned for " + plannedDateTime(update.due_at) : ""}</p>
      ${update.note ? `<p>${esc(update.note)}</p>` : ""}</li>`).join("");
    const sent = request.nextUrl.searchParams.has("sent");
    return render(`<h1>Your order itinerary</h1><p class="reference">${orderPlan(order.plan)}</p>
      <section class="overview"><div><h2>${next ? next.status === "blocked" ? "Action needed" : "Next step" : "Your website has launched"}</h2>
        <p>${next ? `<strong>${next.title}</strong> · ${taskOwner[next.owner]}<br>${esc(next.note || next.help)}` : "All launch tasks are complete."}</p></div>
        <span class="progress-count">${complete} of 5 tasks complete</span></section>
      <section class="card"><h2>Tasks and dates</h2><ol class="tasks">
        <li class="task"><div><h3>Payment confirmed</h3></div><div class="meta"><span class="badge complete">Complete</span><span>Owner · You</span><span>${orderDateTime(itinerary.paid_at)}</span></div></li>
        <li class="task"><div><h3>Website details submitted</h3></div><div class="meta"><span class="badge complete">Complete</span><span>Owner · You</span><span>${orderDateTime(itinerary.submitted_at)}</span></div></li>
        ${rows}</ol></section>
      <div class="updates">
        <details class="card"><summary>Task updates <span class="subtle">(${itinerary.updates.length})</span></summary>
          ${updates ? `<ol class="activity">${updates}</ol>` : "<p>No task updates yet. Dates and status changes will appear here.</p>"}</details>
        <details class="card" id="messages"${sent ? " open" : ""}><summary>Messages <span class="subtle">(${messages.length})</span></summary>
          ${sent ? '<p role="status">Message sent.</p>' : ""}
          ${renderOrderMessages(messages,"You")}
          <details><summary>Write a message</summary>
            <form method="post" action="/order/progress?key=${token}"><label for="message">Message to Yotion</label><textarea id="message" name="message" maxlength="2000" required></textarea><button type="submit" class="customer-button">Send message</button></form>
          </details>
        </details>
      </div><details class="order-ref"><summary>Order reference</summary><p class="reference">${esc(order.order_reference)}</p></details>`);
  } catch {
    return failed();
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) return new Response("Forbidden", { status: 403 });
  const token = request.nextUrl.searchParams.get("key") ?? "";
  if (!orderToken.test(token)) return unavailable();
  const form = await request.formData();
  const message = String(form.get("message") ?? "").trim();
  if (!message || message.length > 2000) return render("<h1>Check your message</h1><p>Enter a message of 2,000 characters or fewer.</p>", 400);
  try {
    if (!(await readOrder(token))?.submitted_at) return unavailable();
    await orderMessages(token, null, message);
    return new Response(null, { status: 303, headers: { Location: `/order/progress?key=${token}&sent=1#messages`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch {
    return failed();
  }
}
