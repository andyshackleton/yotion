import {NextRequest,NextResponse} from "next/server";
import {isAdmin} from "../../../../../lib/yotion-admin-auth";
import {isSameOriginPost} from "../../../../../lib/yotion-admin-csrf";
import {db} from "../../../../../lib/yotion-db";
import {isWebsiteConfig} from "../../../../../lib/yotion-website-config";
import {customerWorkspaceShell} from "../../../../../lib/yotion-admin-workspace";
export const dynamic="force-dynamic";
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
const fallback="I don’t have a confirmed answer to that question. Please use the enquiry form to ask the instructor.";
const back=(r:NextRequest,id:string,result:string)=>NextResponse.redirect(new URL("/admin/requests/"+id+"/assistant?save="+result,r.url),303);
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url));
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 const [demo,req]=await Promise.all([db().rpc("yotion_admin_get_website_demo",{p_request_id:id}),db().rpc("yotion_admin_get_demo_request",{p_id:id})]);
 if(demo.error||req.error)return new NextResponse("Unable to load assistant",{status:500});
 if(!demo.data||!req.data?.request||!isWebsiteConfig(demo.data.config))return NextResponse.redirect(new URL("/admin/requests/"+id,request.url));
 const cfg=demo.data.config,assistant=cfg.assistant,base="/admin/requests/"+id;
 const message=request.nextUrl.searchParams.get("save");
 const body='<style>.assistant-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);gap:20px}.assistant-panel{background:white;border:1px solid var(--line);border-radius:14px;padding:25px}.assistant-panel h2{margin:0 0 8px}.assistant-panel label{display:block;margin:22px 0 8px;font-weight:700}.assistant-panel input[type=text],.assistant-panel textarea{width:100%;border:1px solid #c4d2cb;border-radius:9px;padding:12px;font:inherit}.assistant-panel textarea{min-height:130px}.assistant-panel button{background:var(--brand);border:0;border-radius:9px;padding:12px 20px;color:white;font:inherit;font-weight:700;cursor:pointer}.assistant-panel .check{display:flex;align-items:center;gap:10px}.assistant-panel .check input{width:auto}.assistant-panel .check label{margin:0}.assistant-panel p{color:var(--muted)}@media(max-width:800px){.assistant-grid{grid-template-columns:1fr}}</style><div><h2>Assistant settings</h2><p class="muted">Configure how the website assistant greets visitors and responds when an answer is not confirmed. Knowledge entries are managed separately.</p></div>'+(message?'<p role="status">'+(message==="saved"?"Assistant settings saved.":"Unable to save assistant settings.")+'</p>':"")+'<div class="assistant-grid"><section class="assistant-panel"><form method="post" action="'+base+'/assistant"><div class="check"><input id="enabled" type="checkbox" name="enabled" '+(assistant.enabled?"checked":"")+'><label for="enabled">Enable website assistant</label></div><label for="welcome">Welcome message</label><textarea id="welcome" name="welcome" maxlength="300">'+esc(assistant.welcomeMessage||"")+'</textarea><label for="fallback">Response when no answer is confirmed</label><textarea id="fallback" name="fallback" maxlength="500">'+esc(assistant.fallbackMessage||fallback)+'</textarea><p>These settings do not change approved knowledge or unanswered questions.</p><button type="submit">Save assistant settings</button></form></section><aside class="assistant-panel"><h2>Assistant knowledge</h2><p>'+esc((assistant.knowledge||[]).filter((x:{approved:boolean})=>x.approved).length)+' approved entries are available to the assistant.</p><a class="button" href="'+base+'/knowledge">Manage knowledge base</a><h2 style="margin-top:28px">Test the customer experience</h2><p>Open the private website preview to test the actual assistant.</p><a href="'+base+'/preview" target="_blank" rel="noopener noreferrer">Open website preview</a></aside></div>';
 return new NextResponse(customerWorkspaceShell({id,school:String(demo.data.school_name||req.data.request.school||"Customer"),active:"assistant",status:String(req.data.request.status||"preparing"),body}),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Frame-Options":"DENY"}});
}
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url),303);
 if(!isSameOriginPost(request))return new NextResponse("Forbidden",{status:403});
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 const form=await request.formData(),welcome=String(form.get("welcome")||"").trim(),response=String(form.get("fallback")||"").trim();
 if(welcome.length>300||response.length>500)return back(request,id,"invalid");
 const demo=await db().rpc("yotion_admin_get_website_demo",{p_request_id:id});
 if(demo.error||!isWebsiteConfig(demo.data?.config))return back(request,id,"failed");
 const cfg=structuredClone(demo.data.config);cfg.assistant.enabled=form.has("enabled");cfg.assistant.welcomeMessage=welcome;cfg.assistant.fallbackMessage=response||fallback;
 const saved=await db().rpc("yotion_admin_save_website_config",{p_request_id:id,p_config:cfg});
 return back(request,id,saved.error||saved.data!==true?"failed":"saved");
}
