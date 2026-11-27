import { NextRequest } from "next/server";
import { db } from "../../../lib/yotion-db";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { escapeOrderHtml as esc, orderPlan, orderToken } from "../../../lib/yotion-order-progress";
import { orderMessages, renderOrderMessages } from "../../../lib/yotion-order-messages";

export const dynamic = "force-dynamic";

const stages = [
  ["Payment confirmed", "Your order is in place."],
  ["Website details received", "We have the school details you submitted."],
  ["Preparing your website", "We’ll use your lessons, teaching areas and branding to prepare your site."],
  ["Review your website", "You’ll have a chance to check the site and request changes."],
  ["Go live", "Once you approve the site and your domain is ready, we’ll connect it and launch."],
];

function render(body: string, status = 200) {
  return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Your website progress | Yotion</title><link rel="icon" href="/yotion-icon.svg"><style>
  *{box-sizing:border-box}body{margin:0;background:#f6f8f2;color:#172e2b;font:16px/1.55 Arial,sans-serif}
  header{background:white;border-bottom:1px solid #dfe7da}header div,main{max-width:68rem;margin:auto;padding-inline:clamp(1rem,4vw,2rem)}header div{display:flex;min-height:4.5rem;align-items:center;justify-content:space-between;gap:1rem}
  a{color:#175e4c;text-underline-offset:3px}.brand{display:inline-flex;align-items:center;gap:.55rem;text-decoration:none;font-size:1.35rem;font-weight:700;color:#172e2b}
  main{padding-block:clamp(2rem,6vw,4rem)}h1{font-size:clamp(2.1rem,6vw,3.45rem);line-height:1.05;letter-spacing:-.045em;margin:0}h2{font-size:1.35rem;margin:0 0 .5rem}
  .reference{color:#465d51;overflow-wrap:anywhere}.current{background:#203a34;color:white;border-radius:16px;padding:1.35rem 1.6rem;margin:1.4rem 0 1rem}.current p{margin:0;color:#e6eee7}
  .layout{display:grid;grid-template-columns:1fr 1fr;gap:1rem;align-items:start}.card{background:white;border:1px solid #dfe7da;border-radius:16px;padding:clamp(1rem,4vw,1.6rem);min-width:0}
  .stages,.order-messages{list-style:none;margin:0;padding:0}.stages li,.order-messages li{border-bottom:1px solid #dfe7da;padding:.65rem 0}.stages p,.order-messages p{margin:.2rem 0;color:#465d51}.stages [aria-current]{border-left:3px solid #175e4c;padding-left:.6rem}.stage-state,time{display:block;font-size:.875rem;color:#465d51}.order-messages p{white-space:pre-wrap;overflow-wrap:anywhere}
  form{margin-top:1rem}label{font-weight:700}textarea{display:block;width:100%;margin:.3rem 0 .75rem;resize:vertical;min-height:6rem;border:1px solid #697a70;border-radius:8px;padding:.65rem;font:inherit}
  button,.button{display:inline-block;border:1px solid #172e2b;border-radius:8px;background:#cfe77a;color:#172e2b;padding:.65rem 1rem;font:inherit;cursor:pointer;text-decoration:none}button:hover,.button:hover{background:#e2f39f}:focus-visible{outline:3px solid #175e4c;outline-offset:4px}
  @media(max-width:690px){.layout{grid-template-columns:1fr}}
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
    if (!order.submitted_at) return render(`<h1>Your website setup</h1><p>Send us your website details to get started.</p><a class="button" href="/order/setup?key=${token}">Continue website setup</a>`);

    const current = order.progress_status === "review" ? 3 : order.progress_status === "preparing" ? 2 : 1;
    const timeline = stages.map(([title, detail], index) => `<li${index === current ? ' aria-current="step"' : ""}>
      <span class="stage-state">${index < current ? "Complete" : index === current ? "Current step" : "Upcoming"}</span><strong>${title}</strong><p>${detail}</p></li>`).join("");
    const messages = await orderMessages(token, null);
    return render(`<h1>Your website progress</h1><p class="reference">${orderPlan(order.plan)} · Order ${esc(order.order_reference)}</p>
      <section class="current"><h2>${stages[current][0]}</h2><p>${current === 3 ? "Look for review instructions in Messages below. If you need the link, ask us here." : "We’ll let you know if we need anything else from you."}</p></section>
      <div class="layout"><section class="card"><h2>Your launch timeline</h2><ol class="stages">${timeline}</ol></section>
      <section class="card" id="messages"><h2>Messages</h2><p>Ask us a question or share an update about your website. Replies posted here stay with your order.</p>
        ${request.nextUrl.searchParams.has("sent") ? '<p role="status">Message sent.</p>' : ""}
        ${renderOrderMessages(messages,"You")}
        <form method="post" action="/order/progress?key=${token}"><label for="message">Message to Yotion</label><textarea id="message" name="message" maxlength="2000" required></textarea><button type="submit">Send message</button></form>
      </section></div>`);
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
