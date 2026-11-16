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
 const tasks=[
  {name:"School identity and branding",detail:"Name, website slug and brand colour",href:base+"?legacy=1",ready:!!demo.data},
  {name:"Website content",detail:"Lessons, instructor, teaching areas and contact",href:base+"/website",ready:!!cfg},
  {name:"Knowledge base",detail:knowledge.length+" knowledge entries · "+knowledge.filter(x=>x.approved).length+" approved",href:base+"/knowledge",ready:knowledge.some(x=>x.approved)},
  {name:"Preview website",detail:"Check the website before publishing",href:base+"/preview",ready:demo.data?.status==="published"},
  {name:"Publish and send",detail:"Review readiness and deliver the customer demo",href:base+"/publishing",ready:String(record.status)==="sent"||String(record.status)==="converted"}
 ];
 const body='<div class="grid"><div><section class="panel"><h2>Website preparation</h2><p class="muted">Work through the customer setup and review each stage before delivery.</p>'+tasks.map(t=>'<a class="task" href="'+t.href+'"><span><strong>'+esc(t.name)+'</strong><small>'+esc(t.detail)+'</small></span><span class="status">'+(t.ready?"Configured":"To review")+'</span></a>').join("")+'</section><section class="panel" style="margin-top:20px"><h2>Recent activity</h2>'+(events.length?events.slice(0,5).map(e=>'<div class="activity"><strong>'+esc(String(e.status||"Update"))+'</strong><small>'+esc(displayDate(e.created_at))+'</small>'+(e.note?'<div>'+esc(e.note)+'</div>':"")+'</div>').join(""):'<p class="muted">No activity recorded yet.</p>')+'</section></div><aside><section class="panel"><h2>Customer details</h2><dl class="meta"><dt>Contact</dt><dd>'+esc(record.name||"Not supplied")+'</dd><dt>Email</dt><dd>'+esc(record.email||"Not supplied")+'</dd><dt>Postcode</dt><dd>'+esc(record.postcode||"Not supplied")+'</dd><dt>Received</dt><dd>'+esc(displayDate(record.created_at))+'</dd></dl><a class="button" href="'+base+'?legacy=1">Manage request</a></section><section class="panel" style="margin-top:20px"><h2>Website</h2><p class="muted">'+esc(demo.data?.slug||"No draft created")+'</p><a href="'+base+'/preview">Open private preview</a></section></aside></div>';
 return new NextResponse(customerWorkspaceShell({id,school,active:"overview",status:String(record.status||"received").replace(/_/g," "),body}),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Frame-Options":"DENY"}});
}
