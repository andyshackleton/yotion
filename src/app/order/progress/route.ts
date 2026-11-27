import { db } from "../../../lib/yotion-db";
import { marketingPage } from "../../../lib/yotion-marketing-page";
import { escapeOrderHtml, orderPlan, orderStatus, orderToken } from "../../../lib/yotion-order-progress";

export const dynamic = "force-dynamic";

function render(body: string, status = 200) {
  const page = marketingPage({
    title: "Your website progress", breadcrumb: "Website progress",
    metadata: '<meta name="robots" content="noindex,nofollow">',
    body: `<section class="order-progress">${body}</section>`,
    pageStyles: ".order-progress{max-width:44rem;margin:3rem auto}.order-status{background:#eef3e6;border-radius:12px;padding:1rem 1.5rem}.order-status h2{margin:.2rem 0}",
  });
  const headers = new Headers(page.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(page.body, { status, headers });
}

const unavailable = () => render("<h1>This progress link is unavailable</h1><p>Use the private link in your Yotion email.</p>", 404);

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("key") ?? "";
  if (!orderToken.test(token)) return unavailable();
  try {
    const { data, error } = await db().rpc("yotion_read_order_progress", { p_token: token });
    if (error) throw error;
    const order = data?.[0];
    if (!order) return unavailable();
    if (!order.submitted_at) {
      return render(`<h1>Your website setup</h1><p>Send us your website details to get started.</p><a class="report-button" href="/order/setup?key=${token}">Continue website setup</a>`);
    }
    const status = order.progress_status as keyof typeof orderStatus;
    const detail = status === "review"
      ? "Your website is ready for you to review. Contact us if you need your review link."
      : status === "preparing"
        ? "We’re using your school details to prepare your website. We’ll be in touch when it’s ready to review."
        : "We have your school details and will review them before preparing your website.";
    return render(`<h1>Your website progress</h1><p>${orderPlan(order.plan)} · Order ${escapeOrderHtml(order.order_reference)}</p>
      <div class="order-status"><h2>${orderStatus[status] ?? orderStatus.received}</h2><p>${detail}</p></div>
      <p>Questions about your order? <a href="mailto:hello@yotion.co.uk">Contact Yotion</a>.</p>`);
  } catch {
    return render("<h1>We couldn’t load your website progress</h1><p>Please try again in a moment.</p>", 503);
  }
}
