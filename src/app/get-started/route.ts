import { NextRequest } from "next/server";
import { isSameOriginPost } from "../../lib/yotion-admin-csrf";
import { marketingPage } from "../../lib/yotion-marketing-page";

export const dynamic = "force-dynamic";

const fields = [
  { name: "email", label: "Email used at Stripe checkout", type: "email", max: 254, required: true },
  { name: "school", label: "Driving school name", type: "text", max: 140, required: true },
  { name: "areas", label: "Teaching areas", type: "text", max: 250, required: true },
  { name: "lessons", label: "Lesson types and prices", type: "textarea", max: 1500, required: true },
  { name: "domain", label: "Existing website or preferred domain", type: "text", max: 250, required: false },
  { name: "branding", label: "Brand colours or a link to your logo", type: "text", max: 500, required: false },
  { name: "notes", label: "Anything else we should know?", type: "textarea", max: 1500, required: false },
];

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] ?? character));

function render(values: Record<string, string> = {}, error = "", submitted = false, status = 200) {
  const formFields = fields.map(field => {
    const attributes = `id="${field.name}" name="${field.name}" maxlength="${field.max}"${field.required ? " required" : ""}`;
    const value = escapeHtml(values[field.name] ?? "");
    const input = field.type === "textarea"
      ? `<textarea ${attributes} rows="3">${value}</textarea>`
      : `<input ${attributes} type="${field.type}" value="${value}"${field.type === "email" ? ' autocomplete="email"' : ""}>`;
    return `<div><label for="${field.name}">${field.label}${field.required ? "" : " (optional)"}</label>${input}</div>`;
  }).join("");

  const body = submitted
    ? `<section class="onboarding"><h1>We’ve received your school details</h1>
       <p>We’ll match your details to your Stripe payment and review what you sent. We’ll email you if we need anything else, and you’ll see your website before it goes live.</p></section>`
    : `<section class="onboarding"><h1>Set up your Yotion website</h1>
       <p>Tell us about your driving school so we can prepare your website. You can review it before it goes live.</p>
       ${error ? `<p role="alert" class="form-error">${escapeHtml(error)}</p>` : ""}
       <form action="/get-started" method="post" enctype="application/x-www-form-urlencoded">
       ${formFields}
       <div hidden><label>Leave this blank <input name="website_url" tabindex="-1" autocomplete="off"></label></div>
       <p>We use these details to match your payment and set up your website. <a href="/privacy">Privacy notice</a></p>
       <button type="submit" class="submit">Send my school details</button></form></section>`;

  const page = marketingPage({
    title: "Get started with Yotion",
    breadcrumb: "Get started",
    metadata: '<meta name="robots" content="noindex">',
    body,
    pageStyles: `.onboarding{max-width:44rem;margin:3rem auto}
      .onboarding form{display:grid;gap:1rem;padding:clamp(1rem,4vw,2rem);background:white;border:1px solid var(--line);border-radius:16px}
      .onboarding label{display:block;font-weight:700;margin-bottom:.25rem}
      .onboarding input,.onboarding textarea{display:block;width:100%;padding:.6rem .75rem;border:1px solid #697a70;border-radius:7px;font:inherit;color:var(--ink)}
      .onboarding textarea{resize:vertical}
      .onboarding .submit{justify-self:start;min-height:48px;padding:.6rem 1.1rem;border:2px solid var(--ink);border-radius:8px;background:#cfe77a;color:var(--ink);font:inherit;font-weight:750;cursor:pointer}
      .onboarding .submit:hover{background:#e2f39f}
      .onboarding .form-error{color:#8b2017;font-weight:700}`,
  });
  const headers = new Headers(page.headers);
  headers.set("Cache-Control", "no-store");
  return new Response(page.body, { headers, status });
}

export function GET() {
  return render();
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) return new Response("Forbidden", { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return new Response("Unsupported form format", { status: 415 });
  }
  const body = await request.text();
  if (body.length > 24000) return new Response("Form too large", { status: 413 });
  const form = new URLSearchParams(body);
  if (form.get("website_url")) return render({}, "", true);

  const values = Object.fromEntries(fields.map(field => [field.name, (form.get(field.name) ?? "").trim()]));
  if (fields.some(field => values[field.name].length > field.max || (field.required && !values[field.name])) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return render(values, "Check the required fields and enter the email address you used at checkout.", false, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.YOTION_FROM_EMAIL;
  try {
    if (!apiKey || !from) throw new Error("Email configuration missing");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: ["hello@yotion.co.uk"],
        reply_to: values.email,
        subject: "Yotion onboarding details received",
        text: ["Confirm payment in Stripe before proceeding.", ...fields.map(field => `${field.label}: ${values[field.name] || "—"}`)].join("\n\n"),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Email delivery request returned ${response.status}`);
    return render({}, "", true);
  } catch (error) {
    console.error("Yotion onboarding notification failed", error);
    return render(values, "We couldn’t send your details just now. Your answers are still here. Please try again.", false, 503);
  }
}
