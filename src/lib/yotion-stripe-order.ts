import Stripe from "stripe";

export function stripeOrderConfiguration() {
  const key = process.env.YOTION_STRIPE_SECRET_KEY;
  const signingSecret = process.env.YOTION_STRIPE_WEBHOOK_SECRET;
  const essential = process.env.YOTION_STRIPE_ESSENTIAL_LINK_ID;
  const managed = process.env.YOTION_STRIPE_MANAGED_LINK_ID;
  if (!key || !signingSecret || !essential?.startsWith("plink_") ||
      !managed?.startsWith("plink_") || essential === managed) return null;

  return {
    stripe: new Stripe(key),
    signingSecret,
    liveMode: /^(sk|rk)_live_/.test(key),
    plans: new Map([
      [essential, { name: "essential", total: 9900 }],
      [managed, { name: "managed", total: 3999 }],
    ]),
  };
}
