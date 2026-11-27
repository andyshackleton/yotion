import { db } from "../../../lib/yotion-db";
import { marketingPage } from "../../../lib/yotion-marketing-page";

export const dynamic = "force-dynamic";

function confirmation(body: string, status = 200) {
  const page = marketingPage({
    title: "Your Yotion order",
    breadcrumb: "Your order",
    body: `<section class="order-confirmation">${body}</section>`,
    metadata: '<meta name="robots" content="noindex,nofollow">',
    pageStyles: ".order-confirmation{max-width:44rem;margin:3rem auto}.order-confirmation dl{padding:1rem 1.5rem;background:#eef3e6;border-radius:12px}.order-confirmation dt{font-weight:700}.order-confirmation dd{margin:0 0 .6rem;overflow-wrap:anywhere}",
  });
  const headers = new Headers(page.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(page.body, { status, headers });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("session_id") ?? "";
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) {
    return confirmation("<h1>Open your checkout confirmation</h1><p>Return to this page using the link provided at the end of Stripe checkout.</p>", 404);
  }

  try {
    const { data, error } = await db().rpc("yotion_get_paid_order", { p_session_id: id });
    if (error) throw error;
    const order = data?.[0];
    if (!order) {
      return confirmation('<h1>We’re waiting for payment confirmation</h1><p>Refresh this page in a moment. If your payment method takes longer to confirm, you can return to this page later.</p><p><a href="">Check again</a></p>');
    }

    const plan = order.plan === "essential" ? "Essential Presence" : "Managed Presence";
    const amount = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(order.amount_paid) / 100);
    const reference = String(order.order_reference);
    if (!/^[a-f0-9-]{36}$/.test(reference)) throw new Error("Invalid order reference");
    return confirmation(`<h1>Thank you for choosing Yotion</h1>
      <p>Your order is confirmed.</p>
      <dl><dt>Order reference</dt><dd>${reference}</dd><dt>Your plan</dt><dd>${plan}</dd><dt>Paid today</dt><dd>${amount}</dd></dl>
      <h2>What happens next</h2>
      <p>We’ll need your school details, lesson information and branding to prepare your website. You’ll review it before it goes live.</p>
      <p>Already own a domain? Have its web address to hand. If you still need one, register it in your own name before launch.</p>`);
  } catch {
    return confirmation("<h1>We couldn’t load your order</h1><p>Please refresh in a moment. You can also contact hello@yotion.co.uk for help with your order.</p>", 503);
  }
}
