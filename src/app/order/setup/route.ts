import { sendOrderEmail } from "../../../lib/yotion-order-email";
import { NextRequest } from "next/server";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { db } from "../../../lib/yotion-db";
import { marketingPage } from "../../../lib/yotion-marketing-page";

export const dynamic = "force-dynamic";

const tokenPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const fields = [
  { key: "school", label: "Driving school name", max: 140, required: true },
  { key: "areas", label: "Teaching areas", max: 250, required: true },
  { key: "lessons", label: "Lesson types and prices", max: 1500, required: true },
  { key: "domain", label: "Your domain or current website", max: 250, required: false },
  { key: "branding", label: "Brand colours or a link to your logo", max: 500, required: false },
  { key: "notes", label: "Anything else we should know?", max: 1500, required: false },
];
const domains = [
  ["owned", "I already own a domain"],
  ["register", "I still need to register one"],
  ["help", "I’d like help choosing one"],
];
const esc = (value: string) => value.replace(/[&<>"']/g, ch => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[ch] ?? ch));
const setupPath = (token: string) => `/order/setup?key=${encodeURIComponent(token)}`;

function page(body: string, status = 200) {
  const rendered = marketingPage({
    title: "Website setup",
    breadcrumb: "Website setup",
    body: `<section class="setup">${body}</section>`,
    metadata: '<meta name="robots" content="noindex,nofollow">',
    pageStyles: `.setup{max-width:44rem;margin:3rem auto}
      .setup form{display:grid;gap:1rem;padding:clamp(1rem,4vw,2rem);background:white;border:1px solid var(--line);border-radius:16px}
      .setup label,.setup legend{display:block;font-weight:650}
      .setup fieldset{border:1px solid var(--line);border-radius:8px;margin:0}
      .setup label:has(input[type=radio]){font-weight:400;padding:.25rem 0}
      .setup input:not([type=radio]),.setup textarea{display:block;width:100%;padding:.65rem;border:1px solid #697a70;border-radius:7px;font:inherit;color:var(--ink)}
      .setup .actions{display:flex;flex-wrap:wrap;gap:.65rem}.setup button{cursor:pointer}
      .setup .secondary{background:white;color:var(--green)}.setup .error{color:#8b2017}`,
  });
  const headers = new Headers(rendered.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(rendered.body, { status, headers });
}

function formPage(token: string, reference: string, values: Record<string, string>, message = "", status = 200) {
  const field = (key: string) => {
    const item = fields.find(field => field.key === key);
    if (!item) throw new Error("Unknown setup field");
    const value = esc(values[key] ?? "");
    const control = item.max > 500
      ? `<textarea id="${key}" name="${key}" maxlength="${item.max}" rows="3">${value}</textarea>`
      : `<input id="${key}" name="${key}" maxlength="${item.max}" value="${value}">`;
    return `<div><label for="${key}">${item.label}${item.required ? " *" : ""}</label>${control}</div>`;
  };
  return page(`<h1>Set up your Yotion website</h1>
    <p>Order ${esc(reference)}. Tell us about your school. You’ll review your website before it goes live.</p>
    <p>Bookmark this private page so you can return later. Keep the link to yourself.</p>
    ${message ? `<p role="${status >= 400 ? "alert" : "status"}" ${status >= 400 ? 'class="error"' : ""}>${esc(message)}</p>` : ""}
    <form method="post" action="${setupPath(token)}">
      ${field("school")}${field("areas")}${field("lessons")}
      <fieldset><legend>Your domain *</legend>
      ${domains.map(([value,label]) => `<label><input type="radio" name="domain_status" value="${value}"${values.domain_status === value ? " checked" : ""}> ${label}</label>`).join("")}
      <p>Yotion will connect your domain. You register and renew it separately.</p></fieldset>
      ${field("domain")}${field("branding")}${field("notes")}
      <div class="actions">
      <button class="report-button secondary" name="action" value="save">Save progress</button>
      <button class="report-button" name="action" value="submit">Submit my website details</button>
      </div>
    </form>`, status);
}

const unavailable = () => page("<h1>This setup link is unavailable</h1><p>Open your Yotion order confirmation to start or resume setup.</p>", 404);
const temporarilyUnavailable = () => page("<h1>We couldn’t load website setup</h1><p>Please try again in a moment.</p>", 503);
const submitted = (token: string, emailFailed = false) => page(`<h1>We’ve received your website details</h1>
  <p>We’ll review your information and prepare your website for you to approve before launch.</p>
  ${emailFailed ? `<p role="alert">Your details are saved. We couldn’t send the confirmation email yet.</p>
  <form method="post" action="${setupPath(token)}"><button class="report-button" name="action" value="submit">Retry confirmation email</button></form>` : ""}
  <p><a class="report-button" href="/order/progress?key=${token}">View my website progress</a></p>`);
async function notifySubmission(token: string) {
  try {
    await sendOrderEmail("progress", { token });
    return redirect(setupPath(token));
  } catch {
    console.error("Yotion could not send setup progress email");
    return submitted(token, true);
  }
}

async function readSetup(token: string) {
  const { data, error } = await db().rpc("yotion_read_order_setup", { p_token: token });
  if (error) throw error;
  return data?.[0];
}

function redirect(path: string) {
  return new Response(null, { status: 303, headers: { Location: path, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("key") ?? "";
  if (!tokenPattern.test(token)) return unavailable();
  try {
    const order = await readSetup(token);
    if (!order) return unavailable();
    if (order.submitted_at) return submitted(token);
    return formPage(token, order.order_reference, order.details, request.nextUrl.searchParams.has("saved") ? "Progress saved." : "");
  } catch {
    return temporarilyUnavailable();
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) return new Response("Forbidden", { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return new Response("Unsupported form format", { status: 415 });
  }
  const body = await request.text();
  if (body.length > 24000) return new Response("Form too large", { status: 413 });
  const form = new URLSearchParams(body);
  const token = request.nextUrl.searchParams.get("key");
  if (!token) {
    const session = form.get("session") ?? "";
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(session)) return unavailable();
    try {
      const { data, error } = await db().rpc("yotion_start_order_setup", { p_session: session });
      if (error) throw error;
      return typeof data === "string" && tokenPattern.test(data) ? redirect(setupPath(data)) : unavailable();
    } catch {
      return temporarilyUnavailable();
    }
  }

  if (!tokenPattern.test(token)) return unavailable();
  const action = form.get("action");
  if (action !== "save" && action !== "submit") return new Response("Invalid action", { status: 400 });
  const values = Object.fromEntries(fields.map(field => [field.key, (form.get(field.key) ?? "").trim()]));
  values.domain_status = form.get("domain_status") ?? "";
  const validDomainChoice = domains.some(([value]) => value === values.domain_status);
  try {
    const order = await readSetup(token);
    if (!order) return unavailable();
    if (order.submitted_at) return action === "submit" ? notifySubmission(token) : redirect(setupPath(token));
    const invalid = fields.some(field => values[field.key].length > field.max) ||
      (Boolean(values.domain_status) && !validDomainChoice) ||
      (action === "submit" && (!validDomainChoice ||
        fields.some(field => field.required && !values[field.key]) ||
        (values.domain_status === "owned" && !values.domain)));
    if (invalid) return formPage(token, order.order_reference, values,
      "Check the field lengths and complete the required details, including your domain if you already own one.", 400);
    const { error } = await db().rpc("yotion_save_order_setup", {
      p_token: token, p_details: values, p_submit: action === "submit",
    });
    if (error) return formPage(token, order.order_reference, values, "We couldn’t save your details. Please try again.", 503);
    return action === "submit" ? notifySubmission(token) : redirect(setupPath(token) + "&saved=1");
  } catch {
    return temporarilyUnavailable();
  }
}
