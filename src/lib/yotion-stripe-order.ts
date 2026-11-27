export function stripeOrderConfiguration() {
  const mode = process.env.YOTION_STRIPE_MODE;
  const signingSecret = process.env.YOTION_STRIPE_WEBHOOK_SECRET;
  const essential = process.env.YOTION_STRIPE_ESSENTIAL_LINK_ID;
  const managed = process.env.YOTION_STRIPE_MANAGED_LINK_ID;
  if ((mode !== "test" && mode !== "live") || !signingSecret || !essential?.startsWith("plink_") ||
      !managed?.startsWith("plink_") || essential === managed) return null;

  return {
    signingSecret,
    liveMode: mode === "live",
    plans: new Map([
      [essential, { name: "essential", total: 9900 }],
      [managed, { name: "managed", total: 3999 }],
    ]),
  };
}
