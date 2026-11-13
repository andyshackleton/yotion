import {parseDemoLink,previewDemoLink} from "../../../../../lib/yotion-demo-url";
import {NextRequest,NextResponse} from "next/server";
import {isAdmin} from "../../../../../lib/yotion-admin-auth";
import {db} from "../../../../../lib/yotion-db";
export const dynamic="force-dynamic";
const redirect=(request:NextRequest,id:string,result:string)=>NextResponse.redirect(new URL("/admin/requests/"+id+"?send="+result,request.url),303);
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url),303);
 const origin=request.headers.get("origin");
 if(!origin||origin!==new URL(request.url).origin)return new NextResponse("Forbidden",{status:403});
 const {id}=await context.params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 const form=await request.formData();
 if(form.get("confirm")!=="send")return redirect(request,id,"invalid");
 try{
  const {data,error}=await db().rpc("yotion_admin_get_demo_request",{p_id:id});
  if(error)throw error;
  const record=data?.request;
  if(!record||record.status!=="ready")return redirect(request,id,"notready");
  const email=String(record.email||"").trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return redirect(request,id,"invalid");
  const raw=String(record.demo_url||"");
  if(!parseDemoLink(raw))return redirect(request,id,"invalid");
  const destination=previewDemoLink(raw);
  if(!destination)return redirect(request,id,"invalid");
  // Do not send links to unimplemented demonstrations.
  const probe=await fetch(destination,{method:"GET",redirect:"manual",cache:"no-store",signal:AbortSignal.timeout(8000)});
  if(!probe.ok||!(probe.headers.get("content-type")||"").includes("text/html"))return redirect(request,id,"unavailable");
  const page=await probe.text();
  if(!page.includes('name="yotion-demo-ready" content="true"'))return redirect(request,id,"unavailable");
  const apiKey=process.env.RESEND_API_KEY,from=process.env.YOTION_FROM_EMAIL;
  if(!apiKey||!from)throw Error("Email configuration missing");
  const school=String(record.school||"your driving school");
  const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
  const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json","Idempotency-Key":"yotion-demo-"+id+"-"+encodeURIComponent(destination)},body:JSON.stringify({from,to:[email],subject:"Your Yotion website demonstration is ready",html:"<p>Hello "+escape(String(record.name||""))+",</p><p>Your personalised demonstration for <strong>"+escape(school)+"</strong> is ready to explore.</p><p><a href=\""+escape(destination)+"\">View your demonstration</a></p><p>Take a look and reply to this email with any questions or changes you'd like to discuss.</p><p>Yotion</p>"})});
  if(!sent.ok){console.error("Yotion demo email failed",sent.status);return redirect(request,id,"failed")}
  const result=await db().rpc("yotion_admin_update_demo_request",{p_id:id,p_status:"sent",p_note:"Personalised demonstration email sent to "+email,p_demo_url:raw});
  if(result.error||result.data!==true){console.error("Yotion demo email delivered but status recording failed",result.error);return redirect(request,id,"recordfailed")}
  return redirect(request,id,"success");
 }catch(e){console.error("Yotion demo sending error",e);return redirect(request,id,"failed")}
}
