import { customerIcon, type CustomerIcon } from "../../../lib/yotion-customer-icons";
import { briefFields, briefSections } from "../../../lib/yotion-website-brief";
import { customerTypography } from "../../../lib/yotion-customer-typography";
import { sendOrderEmail } from "../../../lib/yotion-order-email";
import { NextRequest } from "next/server";
import { isSameOriginPost } from "../../../lib/yotion-admin-csrf";
import { db } from "../../../lib/yotion-db";

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
  return new Response(`<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
  <title>Website setup | Yotion</title><link rel="icon" href="/yotion-icon.svg"><style>
    :root{--ink:#172e2b;--green:#175e4c;--line:#dce6dd;--muted:#465d51;--paper:#f6f8f2}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.65 Arial,sans-serif}
    header{background:white;border-bottom:1px solid var(--line)}header>div,main{max-width:72rem;margin:auto;padding-inline:clamp(1rem,4vw,2.25rem)}
    header>div{min-height:4.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}
    .brand{display:inline-flex;align-items:center;gap:.55rem;font-size:1.35rem;font-weight:700;color:var(--ink);text-decoration:none}
    a{color:var(--green);text-underline-offset:3px}:focus-visible{outline:3px solid var(--green);outline-offset:3px}
    main{padding-block:clamp(1.5rem,5vw,3.25rem) 3rem}
    h1{font-size:clamp(2rem,5vw,3.25rem);line-height:1.08;letter-spacing:-.045em;margin:0}
    .brief-hero{margin:0 0 1.75rem}.brief-hero p{max-width:43rem;margin:.5rem 0 0;color:var(--muted)}
    .brief-layout{display:grid;grid-template-columns:minmax(14rem,.56fr) minmax(0,1.44fr);gap:clamp(1rem,3vw,2rem);align-items:start}
    .brief-nav{display:grid;border:1px solid var(--line);background:#fff;border-radius:12px;padding:.45rem;overflow:hidden}
    .brief-nav p{font-weight:700;font-size:.875rem;margin:.65rem .85rem;color:var(--muted)}
    .brief-nav a{display:flex;align-items:center;gap:.7rem;padding:.65rem .75rem;border-left:3px solid transparent;border-radius:5px;text-decoration:none;color:var(--ink);font-size:.94rem}
    .brief-nav a:hover{background:#f4f7f1}.brief-nav a[aria-current]{background:#eaf2e9;color:var(--green);border-left-color:var(--green);font-weight:700}
    .brief-nav svg,.setup-icon svg{width:18px;height:18px;flex:none}
    .brief-layout form{display:grid;gap:1rem;background:#fff;border:1px solid var(--line);border-radius:14px;padding:clamp(1rem,3.4vw,2rem)}
    .brief-section{scroll-margin-top:1rem}.brief-heading{display:flex;gap:.65rem;align-items:flex-start}.setup-icon{color:var(--green);padding-top:.28rem}
    .step-kicker{color:var(--green);font-size:.875rem;font-weight:700;margin:0}
    .brief-heading h2{font-size:clamp(1.4rem,3vw,1.85rem);line-height:1.18;letter-spacing:-.025em;margin:.12rem 0 0}
    .section-intro{color:var(--muted);margin:.5rem 0 1.2rem;padding-bottom:1rem;border-bottom:1px solid var(--line)}
    .brief-fields{display:grid;gap:1.1rem}.field-help{display:block;font-size:.9rem;line-height:1.45;color:var(--muted);margin:.15rem 0 .4rem}
    label,legend{display:block;font-weight:700;font-size:.95rem;margin-bottom:.18rem}
    input:not([type=radio]),textarea{display:block;width:100%;min-height:44px;padding:.62rem .75rem;border:1px solid #85988b;border-radius:6px;background:white;font:inherit;color:var(--ink)}
    textarea{min-height:7rem;resize:vertical}
    fieldset{border:1px solid var(--line);border-radius:7px;margin:0;padding:.65rem .85rem}fieldset p{margin:.45rem 0;color:var(--muted);font-size:.9rem}
    label:has(input[type=radio]){font-weight:400;padding:.25rem 0;margin:0}
    .actions{display:flex;flex-wrap:wrap;align-items:center;gap:.65rem;padding-top:1.05rem;border-top:1px solid var(--line)}
    .actions #brief-next,.actions #brief-submit{margin-left:auto}.report-button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.55rem .95rem;border:1px solid var(--green);border-radius:7px;background:var(--green);color:#fff;text-decoration:none;cursor:pointer}
    .report-button:hover{background:#203a34}.report-button.secondary{background:white;color:var(--green);border-color:#a9bfb0}.report-button.secondary:hover{background:#edf3e9}
    button[hidden]{display:none}.field-guide{margin:.15rem 0 0;color:var(--muted);font-size:.875rem}
    .setup-feedback{border-left:3px solid var(--green);background:#eaf2e9;padding:.6rem .85rem}
    @media(max-width:700px){.brief-layout{grid-template-columns:1fr}.brief-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.brief-nav p{grid-column:1/-1}.brief-nav a{gap:.4rem;padding:.52rem .45rem}}
    ${customerTypography}
    </style></head><body><header><div><a href="/" class="brand"><img src="/yotion-icon.svg" width="30" height="30" alt="">Yotion</a><a href="mailto:hello@yotion.co.uk">Need help?</a></div></header><main class="setup">${body}</main></body></html>`, {
      status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" },
    });
}

const sectionIcons: Record<string, CustomerIcon> = {
  school: "school", instructor: "person", teaching: "car", contact: "message", branding: "pen", extras: "star",
};

function formPage(token: string, reference: string, values: Record<string, string>, message = "", status = 200, initialStep = "") {
  const domainChoice = `<fieldset><legend>Your domain *</legend>
    ${domains.map(([value,label]) => `<label><input type="radio" name="domain_status" value="${value}"${values.domain_status === value ? " checked" : ""}> ${label}</label>`).join("")}
    <p>Yotion will connect your domain. You register and renew it separately.</p></fieldset>`;
  const sections = briefSections.map((section, index) => {
    const fields = section.fields.map(item => {
      const value = esc(values[item.key] ?? "");
      const help = item.help ? `<small class="field-help" id="${item.key}-help">${item.help}</small>` : "";
      const attributes = `id="brief-${item.key}" name="${item.key}" maxlength="${item.max}"${help ? ` aria-describedby="${item.key}-help"` : ""}`;
      const control = item.multiline
        ? `<textarea ${attributes} rows="3">${value}</textarea>`
        : `<input ${attributes} type="${item.type ?? "text"}" value="${value}">`;
      return `<div><label for="brief-${item.key}">${item.label}${item.required ? " *" : ""}</label>${help}${control}</div>`;
    }).join("");
    return `<section class="brief-section" id="section-${section.id}" aria-labelledby="heading-${section.id}">
      <div class="brief-heading"><span class="setup-icon">${customerIcon(sectionIcons[section.id])}</span><div><p class="step-kicker">Step ${index + 1} of ${briefSections.length}</p><h2 tabindex="-1" id="heading-${section.id}">${section.title}</h2></div></div>
      <p class="section-intro">${section.intro}</p><div class="brief-fields">${section.id === "branding" ? domainChoice : ""}${fields}</div></section>`;
  }).join("");

  return page(`<div class="brief-hero"><h1>Website setup</h1>
    <p>Share the details you’d like on your website. We’ll turn your notes into a draft for you to review.</p></div>
    ${message ? `<p class="setup-feedback" role="${status >= 400 ? "alert" : "status"}">${esc(message)}</p>` : ""}
    <div class="brief-layout" data-step="${esc(initialStep)}">
      <nav class="brief-nav" aria-label="Website setup steps"><p>Your setup steps</p>
        ${briefSections.map(section => `<a href="#section-${section.id}">${customerIcon(sectionIcons[section.id])}<span>${section.title}</span></a>`).join("")}
      </nav>
      <form method="post" action="${setupPath(token)}" novalidate>
        ${sections}
        <p class="field-guide">* Required before you submit.</p>
        <input type="hidden" name="step" id="brief-step">
        <div class="actions">
          <button type="button" id="brief-back" class="report-button customer-button secondary" hidden>Back</button>
          <button class="report-button customer-button secondary" name="action" value="save">Save and finish later</button>
          <button type="button" id="brief-next" class="report-button customer-button" hidden>Continue</button>
          <button id="brief-submit" class="report-button customer-button" name="action" value="submit">Submit my website details</button>
        </div>
      </form>
    </div>
    <script>
      (() => {
        const layout = document.querySelector('.brief-layout');
        const sections = [...layout.querySelectorAll('.brief-section')];
        const links = [...layout.querySelectorAll('.brief-nav a')];
        const back = document.getElementById('brief-back');
        const next = document.getElementById('brief-next');
        const submit = document.getElementById('brief-submit');
        const input = document.getElementById('brief-step');
        let current = 0;
        function show(index, focus) {
          if (index < 0 || index >= sections.length) return;
          current = index;
          sections.forEach((section, i) => { section.hidden = i !== index; });
          links.forEach((link, i) => {
            if (i === index) link.setAttribute('aria-current', 'step');
            else link.removeAttribute('aria-current');
          });
          input.value = sections[index].id.slice('section-'.length);
          back.hidden = index === 0;
          next.hidden = index === sections.length - 1;
          submit.hidden = index !== sections.length - 1;
          if (focus) sections[index].querySelector('h2').focus();
        }
        links.forEach((link, i) => link.addEventListener('click', event => { event.preventDefault(); show(i, true); }));
        back.addEventListener('click', () => show(current - 1, true));
        next.addEventListener('click', () => show(current + 1, true));
        const requested = layout.dataset.step || location.hash.slice('#section-'.length);
        show(Math.max(0, sections.findIndex(section => section.id === 'section-' + requested)), false);
      })();
    </script>`, status);
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
    return formPage(token, order.order_reference, order.details, request.nextUrl.searchParams.has("saved") ? "Progress saved. Your private link will take you back here whenever you’re ready." : "", 200, request.nextUrl.searchParams.get("step") ?? order.details.setup_step ?? "");
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
  const step = form.get("step");
  if (briefSections.some(section => section.id === step)) values.setup_step = String(step);
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
    if (invalid) {
      const first = briefSections.find(section =>
        section.fields.some(field => values[field.key].length > field.max ||
          (action === "submit" && field.required && !values[field.key])) ||
        (section.id === "branding" && (!validDomainChoice || (values.domain_status === "owned" && !values.domain))) ||
        (section.id === "contact" && values.public_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.public_email))
      );
      return formPage(token, order.order_reference, values,
        "Check the highlighted section. Fill in any missing fields marked * and check the details you entered.", 400, first?.id);
    }
    const { error } = await db().rpc("yotion_save_order_setup", {
      p_token: token, p_details: values, p_submit: action === "submit",
    });
    if (error) return formPage(token, order.order_reference, values, "We couldn’t save your details. Please try again.", 503);
    return action === "submit" ? notifySubmission(token) : redirect(setupPath(token) + "&saved=1&step=" + encodeURIComponent(form.get("step") ?? ""));
  } catch {
    return temporarilyUnavailable();
  }
}
