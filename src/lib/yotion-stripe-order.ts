import Stripe from "stripe";

function orderConfiguration(
  mode: string | undefined, signingSecret: string | undefined,
  essential: string | undefined, managed: string | undefined,
) {
  if ((mode !== "test" && mode !== "live") || !signingSecret || !essential?.startsWith("plink_") ||
      !managed?.startsWith("plink_") || essential === managed) return null;

  return {
    signingSecret,
    liveMode: mode === "live",
    plans: new Map([
      [essential, { name: "essential", total: mode === "live" ? 9999 : 9900 }],
      [managed, { name: "managed", total: 3999 }],
    ]),
  };
}

export function stripeOrderConfigurations() {
  return [
    orderConfiguration(process.env.YOTION_STRIPE_MODE, process.env.YOTION_STRIPE_WEBHOOK_SECRET,
      process.env.YOTION_STRIPE_ESSENTIAL_LINK_ID, process.env.YOTION_STRIPE_MANAGED_LINK_ID),
    orderConfiguration("live", process.env.YOTION_STRIPE_LIVE_WEBHOOK_SECRET,
      process.env.YOTION_STRIPE_LIVE_ESSENTIAL_LINK_ID, process.env.YOTION_STRIPE_LIVE_MANAGED_LINK_ID),
  ].filter(config => config !== null);
}

export function verifyOrderEvent(payload: string, signature: string, configurations: ReturnType<typeof stripeOrderConfigurations>) {
  for (const config of configurations) {
    try {
      const event = Stripe.webhooks.constructEvent(payload, signature, config.signingSecret);
      if (event.livemode === config.liveMode) return { event, config };
    } catch {
      // Each endpoint signs using its own secret.
    }
  }
  return null;
}
