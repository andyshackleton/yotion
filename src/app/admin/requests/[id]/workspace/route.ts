import {NextRequest,NextResponse} from "next/server";
import {isAdmin} from "../../../../../lib/yotion-admin-auth";
import {db} from "../../../../../lib/yotion-db";
import {customerWorkspaceShell} from "../../../../../lib/yotion-admin-workspace";
import {isWebsiteConfig} from "../../../../../lib/yotion-website-config";
export const dynamic="force-dynamic";
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
const displayDate=(v:unknown)=>{const d=new Date(String(v||""));return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeZone:"Europe/London"}).format(d)};
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url));
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 const [req,demo]=await Promise.all([db().rpc("yotion_admin_get_demo_request",{p_id:id}),db().rpc("yotion_admin_get_website_demo",{p_request_id:id})]);
 if(req.error||demo.error)return new NextResponse("Unable to load customer workspace",{status:500});
 const record=req.data?.request;if(!record)return new NextResponse("Customer not found",{status:404});
 const events=(req.data?.events||[]) as Array<Record<string,unknown>>;
 const school=String(demo.data?.school_name||record.school||"Customer"),base="/admin/requests/"+id;
 const cfg=isWebsiteConfig(demo.data?.config)?demo.data.config:null;
 const knowledge: Array<{approved:boolean}>=cfg?.assistant.knowledge||[];
 const status=String(record.status||"received");
 const isClosed=["sent","converted","declined","activated"].includes(status);
 const published=demo.data?.status==="published";
 const next=!demo.data ? {title:"Create the website draft",description:"Set the school name, private demo address and brand colour.",link:base,label:"Manage request"} :
   !published ? {title:"Review and prepare the website",description:"Check the lessons, instructor details and contact routes before publishing.",link:base+"/website",label:"Open website editor"} :
   {title:"Send the private demo link",description:"Review the published demo and deliver it to the customer.",link:base+"/publishing",label:"Open publishing"};
 const facts=[["Contact",record.name],["Email",record.email],["Teaching area",record.postcode],
   ["Existing website",record.current_website||record.website],["Preferred colour",record.brand_colour||record.preferred_brand_colour||cfg?.branding.colour]];
 const body=`<div class="request-overview">
   ${isClosed ? "" : `<section class="next-work"><div><p>Next action</p><h2>${next.title}</h2><p>${next.description}</p></div><a class="button" href="${next.link}">${next.label}</a></section>`}
   <div class="grid"><div class="overview-main">
     <section class="panel"><h2>Request brief</h2>
       <dl class="brief-grid">${facts.filter(([,value])=>value).map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>
       ${record.notes ? `<div class="notes"><h3>Customer notes</h3><p>${esc(record.notes)}</p></div>` : ""}
       <a href="${base}">Manage request details</a>
     </section>
     <section class="panel"><h2>Recent activity</h2>${events.length ? events.slice(0,5).map(event=>`<div class="activity"><strong>${esc(String(event.status||"Update").replace(/_/g," "))}</strong>
       <small>${esc(displayDate(event.created_at))}</small>${event.note ? `<div>${esc(event.note)}</div>` : ""}</div>`).join("") : '<p class="muted">No updates recorded.</p>'}</section>
   </div><aside class="overview-main">
     <section class="panel"><h2>Demo at a glance</h2><dl class="meta">
       <dt>Received</dt><dd>${esc(displayDate(record.created_at))}</dd><dt>Website</dt><dd>${published ? "Published demo" : demo.data ? "Private draft" : "Draft pending"}</dd>
       <dt>Knowledge</dt><dd>${knowledge.filter(item=>item.approved).length} of ${knowledge.length} entries approved</dd></dl>
       ${demo.data ? `<a class="button" href="${base}/preview" target="_blank" rel="noopener noreferrer">Preview website</a>` : ""}
     </section>
   </aside></div></div>`;
 const styles=`
  .next-work{display:flex;align-items:center;justify-content:space-between;gap:1rem 2rem;flex-wrap:wrap;background:#203a34;color:white;border-radius:10px;padding:1.15rem 1.35rem;margin-bottom:1rem}
  .next-work h2{margin:.2rem 0;font-size:1.45rem}.next-work p{margin:0;color:#dfebe2}.next-work p:first-child{font-size:.85rem;font-weight:700;color:#cfe77a}
  .next-work .button{background:#cfe77a;color:#172e2b}.overview-main{display:grid;gap:1rem;align-content:start;min-width:0}
  .brief-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(12rem,1fr));gap:.85rem;margin:1rem 0}
  .brief-grid dt{font-size:.85rem;color:var(--muted)}.brief-grid dd{margin:.1rem 0;font-weight:700;overflow-wrap:anywhere}
  .notes{border-top:1px solid var(--line);padding:.8rem 0}.notes h3{margin:0;font-size:1rem}.notes p{margin:.35rem 0;white-space:pre-wrap;overflow-wrap:anywhere}
 `;
 return new NextResponse(customerWorkspaceShell({id,school,active:"overview",status:status.replace(/_/g," "),body,styles}),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Frame-Options":"DENY"}});
}
