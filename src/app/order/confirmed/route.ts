import { customerTypography } from "../../../lib/yotion-customer-typography";
import { NextRequest } from "next/server";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { db } from "../../../lib/yotion-db";
import { sendOrderEmail } from "../../../lib/yotion-order-email";
import { escapeOrderHtml, money, orderPlan } from "../../../lib/yotion-order-progress";

export const dynamic = "force-dynamic";

const sessionPattern = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

function confirmation(body: string, status = 200) {
  return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow"><title>Your order | Yotion</title>
  <link rel="icon" href="/yotion-icon.svg"><style>
  *{box-sizing:border-box}body{margin:0;background:#f6f8f2;color:#172e2b;font:16px/1.55 Arial,sans-serif}
  header{border-bottom:1px solid #dfe7da;background:#fff}header div,main,footer{max-width:68rem;margin:auto;padding-inline:clamp(1rem,4vw,2.25rem)}
  header div{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4.5rem}
  a{color:#175e4c;text-underline-offset:3px}a:focus-visible,button:focus-visible{outline:3px solid #175e4c;outline-offset:4px}
  .brand{display:inline-flex;align-items:center;gap:.55rem;color:#172e2b;text-decoration:none;font-size:1.35rem;font-weight:700}
  main{padding-block:clamp(2rem,7vw,5rem) 3rem}footer{padding-block:0 2rem;color:#465d51}
  .confirmed{color:#175e4c;font-size:.95rem;font-weight:700;margin:0 0 .75rem}
  h1{font-size:clamp(2.1rem,6vw,3.8rem);letter-spacing:-.055em;line-height:1.04;margin:0 0 .9rem}
  h2{font-size:1.32rem;line-height:1.25;margin:0 0 .65rem}p{margin:.45rem 0 1rem}
  .intro{max-width:37rem;font-size:1.1rem;color:#465d51;margin-bottom:1.8rem}
  .layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:1rem;align-items:start}
  .card{padding:clamp(1.15rem,4vw,2rem);border:1px solid #dfe7da;border-radius:16px;background:#fff}
  .next{background:#203a34;color:white;border-color:#203a34}.next p,.next ol{color:#e6eee7}.next ol{padding-left:1.35rem;margin:.75rem 0 1.25rem}.next li+li{margin-top:.55rem}
  .cta{background:#cfe77a;color:#172e2b;border:1px solid #cfe77a;border-radius:8px;padding:.8rem 1rem;min-height:48px;font:400 1rem Arial,sans-serif;cursor:pointer}
  .cta:hover{background:#e2f39f}.next .cta:focus-visible{outline-color:white}
  dl{margin:0}dl div{padding:.7rem 0;border-top:1px solid #e6ece2;display:grid;gap:.1rem}dt{color:#465d51}dd{margin:0;font-weight:700;overflow-wrap:anywhere}.reference{font-size:.85rem;font-weight:400}
  .email{margin:1rem 0 0;color:#465d51}.text-button{border:none;padding:.3rem 0;background:none;font:inherit;color:#175e4c;text-decoration:underline;cursor:pointer}
  @media(max-width:660px){.layout{grid-template-columns:1fr}}

  ${customerTypography}
  </style></head><body><header><div><a class="brand" href="/"><img src="/yotion-icon.svg" width="30" height="30" alt="">Yotion</a><a href="mailto:hello@yotion.co.uk">Need help?</a></div></header>
  <main>${body}</main><footer>Yotion · Managed websites for driving schools</footer></body></html>`, {
    status, headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
    },
  });
}

const unavailable = () => confirmation("<h1>Open your order confirmation</h1><p>Use the link shown at the end of Stripe checkout.</p>", 404);
const failed = () => confirmation("<h1>We couldn’t load your order</h1><p>Please try again in a moment or email hello@yotion.co.uk for help.</p>", 503);

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("session_id") ?? "";
  if (!sessionPattern.test(id)) return unavailable();

  try {
    const client = db();
    const { data, error } = await client.rpc("yotion_get_paid_order", { p_session_id: id });
    if (error) throw error;
    const order = data?.[0];
    if (!order) {
      return confirmation('<h1>We’re waiting for payment confirmation</h1><p>Refresh this page in a moment. You can also return to this link later.</p><p><a href="">Check again</a></p>');
    }
    const { data: emailRows, error: emailError } = await client.rpc("yotion_order_email", { p_session: id, p_token: null });
    const emailSent = !emailError && Boolean(emailRows?.[0]?.welcome_sent_at);
    const result = request.nextUrl.searchParams.get("email");
    const renewal = order.plan === "essential" ? "£69 a year" : "£39.99 a month";
    return confirmation(`<p class="confirmed">✓ Payment confirmed</p>
      <h1>Thank you for choosing Yotion.</h1>
      <p class="intro">Your order is confirmed. Let’s get your driving school ready to go online.</p>
      <div class="layout">
        <section class="card next"><h2>Start your website setup</h2>
          <ol>
            <li><strong>Tell us about your school.</strong> Share your lessons, teaching areas, branding and domain plans. You can save your progress and come back later.</li>
            <li><strong>We prepare your website.</strong> Once you submit your details, you’ll be able to track progress online.</li>
            <li><strong>Review it before launch.</strong> You’ll see your website before it goes live.</li>
          </ol>
          <form method="post" action="/order/setup"><input type="hidden" name="session" value="${id}"><button class="cta customer-button" type="submit">Start my website setup</button></form>
        </section>
        <section class="card"><h2>Order summary</h2>
          <dl><div><dt>Plan</dt><dd>${orderPlan(order.plan)}</dd></div><div><dt>Paid today</dt><dd>${money(Number(order.amount_paid))}</dd></div>
          <div><dt>Automatic renewal</dt><dd>${renewal}</dd></div><div><dt>Order reference</dt><dd class="reference">${escapeOrderHtml(order.order_reference)}</dd></div></dl>
          ${emailSent ? '<p class="email" role="status">We’ve sent your welcome email to the address you used at checkout.</p>' :
            `<p class="email" role="status">${result === "unavailable" ? "We couldn’t send your welcome email yet. You can still start your setup." : "Your welcome email includes a private link to return to setup."}</p>
            <form method="post"><input type="hidden" name="session" value="${id}"><button type="submit" class="text-button">Send my welcome email</button></form>`}
        </section>
      </div>`);
  } catch {
    return failed();
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) return new Response("Forbidden", { status: 403 });
  const form = await request.formData();
  const id = form.get("session");
  if (typeof id !== "string" || !sessionPattern.test(id)) return unavailable();
  let sent = false;
  try {
    const { data, error } = await db().rpc("yotion_get_paid_order", { p_session_id: id });
    if (error) return failed();
    if (!data?.[0]) return unavailable();
    await sendOrderEmail("welcome", { session: id });
    const delivery = await db().rpc("yotion_order_email", { p_session: id, p_token: null });
    sent = !delivery.error && Boolean(delivery.data?.[0]?.welcome_sent_at);
  } catch {
    console.error("Yotion welcome email retry failed");
  }
  return new Response(null, { status: 303, headers: {
    Location: `/order/confirmed?session_id=${id}&email=${sent ? "sent" : "unavailable"}`,
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
  } });
}
