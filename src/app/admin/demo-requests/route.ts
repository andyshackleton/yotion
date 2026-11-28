import { NextRequest, NextResponse } from "next/server";
import { adminShell } from "../../../lib/yotion-admin-shell";
import { queueFilters, queueSearch, queueStyles } from "../../../lib/yotion-admin-queue";
import { isAdmin } from "../../../lib/yotion-admin-auth";
import { db } from "../../../lib/yotion-db";
import { escapeOrderHtml as esc } from "../../../lib/yotion-order-progress";

export const dynamic = "force-dynamic";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });
const blank = "—";
const groups = {
  new: "New requests", working: "Being prepared", ready: "Ready to send", closed: "Sent or closed",
} as const;

function group(status: string): keyof typeof groups {
  if (["sent", "converted", "declined", "activated"].includes(status)) return "closed";
  if (status === "ready") return "ready";
  if (["reviewing", "preparing", "approved"].includes(status)) return "working";
  return "new";
}

const styles = queueStyles + `
  .request-grid{display:grid;grid-template-columns:minmax(13rem,1.45fr) minmax(8rem,1fr) minmax(7rem,.8fr) auto;gap:.7rem 1rem;align-items:center;padding:.7rem .95rem}
  .request-columns{background:#edf3e9;color:#345048;font-size:.85rem;font-weight:700}
  .request-grid+.request-grid{border-top:1px solid var(--yotion-line)}
  .request-grid strong,.request-grid small{display:block;overflow-wrap:anywhere}.request-grid small,.received{color:var(--yotion-muted);font-size:.87rem}
  .request-badge{width:fit-content;padding:.2rem .48rem;border-radius:5px;background:#eaf0e8;color:#274a3b;font-size:.85rem;font-weight:700}
  .request-badge.new{background:#f6efdc;color:#613d14}.request-badge.ready{background:#dcecd9;color:#224c36}
  .request-action{text-align:right}.queue-tools button{cursor:pointer}
  @media(max-width:960px){.request-grid{grid-template-columns:minmax(0,1fr) minmax(0,.7fr)}.request-columns{display:none}.request-action{text-align:left}}
`;

export async function GET(request: NextRequest) {
  if (!await isAdmin()) return NextResponse.redirect(new URL("/admin/login", request.url));
  const { data, error } = await db().rpc("yotion_admin_list_demo_requests");
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  const requested = request.nextUrl.searchParams.get("filter") ?? "";
  const filter = Object.hasOwn(groups, requested) ? requested : "all";
  const queueUrl = (selection: string, search = query) => {
    const params = new URLSearchParams();
    if (selection !== "all") params.set("filter", selection);
    if (search) params.set("q", search);
    return "/admin/demo-requests" + (params.size ? "?" + params : "");
  };
  const rows = ((data ?? []) as Record<string, unknown>[]).map(record => ({
    record, bucket: group(String(record.status ?? "received").toLowerCase()),
  }));
  const priority = { ready: 0, new: 1, working: 2, closed: 3 };
  const visible = rows.filter(({ record, bucket }) => (filter === "all" || bucket === filter) &&
    [record.school, record.name, record.email].join(" ").toLowerCase().includes(query.toLowerCase()))
    .sort((a,b) => priority[a.bucket] - priority[b.bucket] ||
      new Date(String(b.record.created_at)).getTime() - new Date(String(a.record.created_at)).getTime());
  const counts = [{ key:"all",label:"All requests",value:rows.length }, ...Object.entries(groups).map(([key,label]) =>
    ({ key,label,value:rows.filter(row => row.bucket === key).length }))];
  const list = visible.map(({ record, bucket }) => {
    const base = "/admin/requests/" + encodeURIComponent(String(record.id));
    const received = new Date(String(record.created_at ?? ""));
    const when = Number.isNaN(received.getTime()) ? blank : date.format(received);
    const rawStatus = String(record.status ?? "received").replace(/_/g, " ");
    const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
    return `<article class="request-grid">
      <div><strong>${esc(record.school || "Unnamed school")}</strong><small>${esc([record.name, record.email].filter(Boolean).join(" · ") || blank)}</small></div>
      <span class="request-badge ${bucket}">${esc(status)}</span><span class="received">${when}</span>
      <div class="request-action"><a class="queue-link" href="${base}/workspace">Open request</a></div>
    </article>`;
  }).join("");
  const html = adminShell({ title:"Demo requests", section:"demos", styles, body:`
    <div class="queue-header"><div><h1 class="admin-heading">Demo requests</h1><p>Review free demo requests, prepare the draft and send it when it’s ready.</p></div>
      <a class="queue-link" href="${esc(queueUrl(filter))}">Refresh requests</a></div>
    ${error ? '<p class="queue-notice" role="alert">Requests could not be loaded. Please refresh and try again.</p>' :
      `${queueFilters(counts.map(item => ({ label:item.label,value:item.value,href:queueUrl(item.key),selected:item.key === filter,attention:item.key === "ready" && item.value > 0 })))}
      <section class="queue-panel" aria-label="Demo request queue">
        <div class="queue-tools"><form method="get" action="/admin/demo-requests">
          ${filter === "all" ? "" : `<input type="hidden" name="filter" value="${filter}">`}
          ${queueSearch("Search requests", query, "Search by school, contact or email")}
          <button class="queue-link" type="submit">Search</button></form><p class="queue-count">${visible.length} of ${rows.length} requests</p></div>
        ${list ? `<div class="request-grid request-columns" aria-hidden="true"><span>Driving school</span><span>Status</span><span>Received</span><span></span></div>${list}` :
          `<div class="queue-empty"><h2>${rows.length ? "No matching requests" : "No demo requests yet"}</h2>
          <p>${rows.length ? '<a href="/admin/demo-requests">Clear search and filters</a>' : "New free demo requests will appear here."}</p></div>`}
      </section>`}` });
  return new NextResponse(html,{status:error ? 503 : 200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Frame-Options":"DENY","Referrer-Policy":"no-referrer"}});
}
