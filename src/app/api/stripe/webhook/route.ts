import type Stripe from "stripe";
import { sendOrderEmail } from "../../../../lib/yotion-order-email";
import { db } from "../../../../lib/yotion-db";
import { stripeOrderConfigurations, verifyOrderEvent } from "../../../../lib/yotion-stripe-order";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configurations = stripeOrderConfigurations();
  if (!configurations.length) return new Response("Ordering is not configured", { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  const verified = verifyOrderEvent(await request.text(), signature, configurations);
  if (!verified) return new Response("Invalid Stripe event", { status: 400 });
  const { event, config } = verified;
  if (event.type !== "checkout.session.completed" && event.type !== "checkout.session.async_payment_succeeded") {
    return new Response(null, { status: 204 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const plan = typeof session.payment_link === "string" ? config.plans.get(session.payment_link) : undefined;
  if (!plan || session.payment_status !== "paid") return new Response(null, { status: 204 });

  const email = session.customer_details?.email;
  if (session.mode !== "subscription" || session.currency !== "gbp" ||
      session.amount_total !== plan.total || typeof session.subscription !== "string" || !email) {
    console.error("Yotion Stripe checkout data did not match its configured plan", event.id);
    return new Response("Unexpected checkout details", { status: 422 });
  }

  try {
    const { error } = await db().rpc("yotion_record_paid_order", {
      p_session_id: session.id,
      p_subscription_id: session.subscription,
      p_email: email,
      p_plan: plan.name,
      p_amount: plan.total,
    });
    if (error) throw error;
    await sendOrderEmail("welcome", { session: session.id });
    return new Response(null, { status: 204 });
  } catch {
    console.error("Yotion could not process a Stripe order", event.id);
    return new Response("Order processing could not be completed", { status: 503 });
  }
}
