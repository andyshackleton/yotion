import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/yotion-db";
import { isWebsiteConfig } from "../../../lib/yotion-website-config";

const tenantHost = /^(?!www\.|sample\.|demo\.)[a-z0-9-]+\.yotion\.co\.uk$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fields = [
  ["learner-name", "Name", 100],
  ["learner-email", "Email", 254],
  ["pickup", "Pickup area", 100],
  ["experience", "Experience", 80],
  ["time", "Preferred time", 80],
  ["learner-notes", "Notes", 1000],
] as const;

export async function POST(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").toLowerCase();
  if (!tenantHost.test(hostname) || request.headers.get("origin") !== `https://${hostname}`) {
    return NextResponse.json({ error: "Website not available." }, { status: 404 });
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ error: "Invalid enquiry." }, { status: 415 });
  }
  const raw = await request.text();
  if (raw.length > 5000) return NextResponse.json({ error: "Enquiry is too long." }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid enquiry." }, { status: 400 });
  }
  if (body?.["enquiry-website"]) return NextResponse.json({ ok: true });
  const values = fields.map(([key, , limit]) => {
    const value = body?.[key];
    return typeof value === "string" ? value.trim().slice(0, limit) : "";
  });
  const [name, email, pickup] = values;
  if (!name || !emailPattern.test(email) || !pickup) {
    return NextResponse.json({ error: "Enter your name, email and pickup area." }, { status: 400 });
  }

  try {
    const { data: site, error } = await db().rpc("yotion_resolve_published_website_domain", { p_hostname: hostname });
    if (error) throw error;
    if (!site) return NextResponse.json({ error: "Website not available." }, { status: 404 });

    const recipient = (isWebsiteConfig(site.config) ? site.config.contact.email : String(site.contact_email || "")).trim();
    if (!emailPattern.test(recipient) || !process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Enquiries are temporarily unavailable." }, { status: 503 });
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Yotion Enquiries <hello@yotion.co.uk>",
        to: [recipient],
        reply_to: email,
        subject: "New driving lesson enquiry",
        text: fields.map(([, label], index) => `${label}: ${values[index] || "Not provided"}`).join("\n"),
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Resend returned ${response.status}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Live school enquiry delivery failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The enquiry could not be sent." }, { status: 502 });
  }
}
