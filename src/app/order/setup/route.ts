import { briefFields, briefSections } from "../../../lib/yotion-website-brief";
import { customerTypography } from "../../../lib/yotion-customer-typography";
import { sendOrderEmail } from "../../../lib/yotion-order-email";
import { NextRequest } from "next/server";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { db } from "../../../lib/yotion-db";
import { marketingPage } from "../../../lib/yotion-marketing-page";

export const dynamic = "force-dynamic";

const tokenPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
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
    pageStyles: `${customerTypography}.setup{max-width:54rem;margin:3rem auto}
      .setup form{display:grid;gap:1rem}
      .setup .brief-section{padding:clamp(1rem,4vw,1.6rem);background:white;border:1px solid var(--line);border-radius:14px}
      .setup .brief-section h2{margin:0 0 .25rem}.setup .brief-section p{margin:.25rem 0 .9rem}
      .setup .brief-fields{display:grid;gap:.95rem}.setup .field-help{display:block;color:var(--muted);margin:0 0 .25rem}
      .setup .brief-nav{display:flex;gap:.5rem 1rem;flex-wrap:wrap;margin:1rem 0 1.5rem}
      .setup .brief-section{scroll-margin-top:1.5rem}.setup .actions{background:var(--paper);padding:.65rem 0}
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
  const domainChoice = `<fieldset><legend>Your domain *</legend>
    ${domains.map(([value,label]) => `<label><input type="radio" name="domain_status" value="${value}"${values.domain_status === value ? " checked" : ""}> ${label}</label>`).join("")}
    <p>Yotion will connect your domain. You register and renew it separately.</p></fieldset>`;
  const sections = briefSections.map(section => {
    const fields = section.fields.map(item => {
      const value = esc(values[item.key] ?? "");
      const help = item.help ? `<small class="field-help" id="${item.key}-help">${item.help}</small>` : "";
      const attributes = `id="brief-${item.key}" name="${item.key}" maxlength="${item.max}"${help ? ` aria-describedby="${item.key}-help"` : ""}`;
      const control = item.multiline
        ? `<textarea ${attributes} rows="3">${value}</textarea>`
        : `<input ${attributes} type="${item.type ?? "text"}" value="${value}">`;
      return `<div><label for="brief-${item.key}">${item.label}${item.required ? " *" : ""}</label>${help}${control}</div>`;
    }).join("");
    return `<section class="brief-section" id="section-${section.id}"><h2>${section.title}</h2>
      <p>${section.intro}</p><div class="brief-fields">${section.id === "branding" ? domainChoice : ""}${fields}</div></section>`;
  }).join("");

  return page(`<h1>Tell us about your driving school</h1>
    <p>Give us the facts and a few rough notes. We’ll turn them into website copy for you to review before launch.</p>
    <p>Only fields marked * are required to submit. Save a draft at any point and return using the private link in your welcome email.</p>
    <nav class="brief-nav" aria-label="Website brief sections">${briefSections.map(section => `<a href="#section-${section.id}">${section.title}</a>`).join("")}</nav>
    ${message ? `<p role="${status >= 400 ? "alert" : "status"}" ${status >= 400 ? 'class="error"' : ""}>${esc(message)}</p>` : ""}
    <form method="post" action="${setupPath(token)}" novalidate>
      ${sections}
      <div class="actions">
      <button class="report-button customer-button secondary" name="action" value="save">Save progress</button>
      <button class="report-button customer-button" name="action" value="submit">Submit my website details</button>
      </div>
    </form>`, status);
}

const unavailable = () => page("<h1>This setup link is unavailable</h1><p>Open your Yotion order confirmation to start or resume setup.</p>", 404);
const temporarilyUnavailable = () => page("<h1>We couldn’t load website setup</h1><p>Please try again in a moment.</p>", 503);
const submitted = (token: string, emailFailed = false) => page(`<h1>We’ve received your website details</h1>
  <p>We’ll review your information and prepare your website for you to approve before launch.</p>
  ${emailFailed ? `<p role="alert">Your details are saved. We couldn’t send the confirmation email yet.</p>
  <form method="post" action="${setupPath(token)}"><button class="report-button customer-button" name="action" value="submit">Retry confirmation email</button></form>` : ""}
  <p><a class="report-button customer-button" href="/order/progress?key=${token}">View my website progress</a></p>`);
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
  if (body.length > 100000) return new Response("Form too large", { status: 413 });
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
  const values = Object.fromEntries(briefFields.map(field => [field.key, (form.get(field.key) ?? "").trim()]));
  values.domain_status = form.get("domain_status") ?? "";
  const validDomainChoice = domains.some(([value]) => value === values.domain_status);
  try {
    const order = await readSetup(token);
    if (!order) return unavailable();
    if (order.submitted_at) return action === "submit" ? notifySubmission(token) : redirect(setupPath(token));
    const invalid = briefFields.some(field => values[field.key].length > field.max) ||
      (Boolean(values.domain_status) && !validDomainChoice) ||
      (action === "submit" && (!validDomainChoice ||
        (Boolean(values.public_email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.public_email)) ||
        briefFields.some(field => field.required && !values[field.key]) ||
        (values.domain_status === "owned" && !values.domain)));
    if (invalid) return formPage(token, order.order_reference, values,
      "Check the required fields, the public email address if supplied, and your domain if you already own one.", 400);
    const { error } = await db().rpc("yotion_save_order_setup", {
      p_token: token, p_details: values, p_submit: action === "submit",
    });
    if (error) return formPage(token, order.order_reference, values, "We couldn’t save your details. Please try again.", 503);
    return action === "submit" ? notifySubmission(token) : redirect(setupPath(token) + "&saved=1");
  } catch {
    return temporarilyUnavailable();
  }
}
