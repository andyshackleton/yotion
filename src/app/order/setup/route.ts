import { customerIcon, type CustomerIcon } from "../../../lib/yotion-customer-icons";
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
    pageStyles: `${customerTypography}.setup{max-width:68rem;margin:3rem auto}
      .setup form{display:grid;gap:1rem}
      .setup .brief-section{padding:clamp(1rem,4vw,1.6rem);background:white;border:1px solid var(--line);border-radius:14px}
      .setup .brief-section h2{margin:0 0 .25rem}.setup .brief-section p{margin:.25rem 0 .9rem}
      .setup .brief-fields{display:grid;gap:.95rem}.setup .field-help{display:block;color:var(--muted);margin:0 0 .25rem}
      .setup .brief-hero{background:#203a34;color:white;border-radius:18px;padding:clamp(1.3rem,4vw,2.25rem);margin:0 0 1.25rem}
      .setup .brief-hero h1{margin:.25rem 0 .55rem}.setup .brief-hero p{color:#e6eee7;max-width:40rem;margin:0}
      .setup .step-kicker{font-size:.875rem;font-weight:700;margin:0;color:#175e4c}.setup .brief-hero .step-kicker{color:#cfe77a}
      .setup .brief-layout{display:grid;grid-template-columns:minmax(13rem,.5fr) minmax(0,1.5fr);gap:1rem;align-items:start}
      .setup .brief-nav{display:grid;gap:.25rem;padding:.65rem;background:#edf3e7;border-radius:14px}
      .setup .brief-nav p{margin:.25rem .5rem}
      .setup .brief-nav a{display:flex;align-items:center;gap:.5rem;padding:.45rem .6rem;border-radius:8px;text-decoration:none;color:#203a34;font-size:.94rem}
      .setup .brief-nav a:hover{text-decoration:underline}.setup .brief-nav a[aria-current]{background:#203a34;color:white}
      .setup .brief-nav svg{width:20px;height:20px;flex:none}
      .setup .brief-heading{display:flex;align-items:center;gap:.85rem}.setup .setup-icon{display:grid;place-items:center;width:2.65rem;height:2.65rem;border-radius:10px;background:#edf3e7;color:#175e4c;flex:none}
      .setup .brief-heading h2{margin:0}.setup .brief-section .section-intro{margin:.6rem 0 1rem}
      .setup .field-guide{margin:0}.setup .setup-feedback{background:#edf3e7;border-left:4px solid #175e4c;padding:.65rem 1rem}
      .setup button[hidden]{display:none}.setup .actions{justify-content:flex-end}
      @media(max-width:720px){.setup .brief-layout{grid-template-columns:1fr}.setup .brief-nav{grid-template-columns:repeat(2,minmax(0,1fr))}.setup .brief-nav p{grid-column:1/-1}.setup .actions{justify-content:flex-start}}
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

  return page(`<div class="brief-hero"><p class="step-kicker">Website setup</p><h1>Let’s get your school online</h1>
    <p>Work through the sections below at your own pace. A few rough notes are enough for us to draft your website copy.</p></div>
    ${message ? `<p class="setup-feedback" role="${status >= 400 ? "alert" : "status"}">${esc(message)}</p>` : ""}
    <div class="brief-layout" data-step="${esc(initialStep)}">
      <nav class="brief-nav" aria-label="Website setup steps"><p>Your setup steps</p>
        ${briefSections.map(section => `<a href="#section-${section.id}">${customerIcon(sectionIcons[section.id])}<span>${section.title}</span></a>`).join("")}
      </nav>
      <form method="post" action="${setupPath(token)}" novalidate>
        <p class="field-guide">Fields marked * are needed before you submit. You can save and finish later.</p>
        ${sections}
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
