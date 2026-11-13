import {isSameOriginPost} from "../../../../../lib/yotion-admin-csrf";
import {demoLink,parseDemoLink} from "../../../../../lib/yotion-demo-url";
import {NextRequest,NextResponse} from "next/server";
import {createHash,randomBytes} from "node:crypto";
import {isAdmin} from "../../../../../lib/yotion-admin-auth";
import {db} from "../../../../../lib/yotion-db";
export const dynamic="force-dynamic";
const back=(r:NextRequest,id:string,result:string)=>NextResponse.redirect(new URL("/admin/requests/"+id+"?demo="+result,r.url),303);
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url),303);
 if(!isSameOriginPost(request))return new NextResponse("Forbidden",{status:403});
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 const f=await request.formData(),action=String(f.get("action")||"");
 try{
  const {data:requestData,error:requestError}=await db().rpc("yotion_admin_get_demo_request",{p_id:id});
  if(requestError||!requestData?.request)throw Error("Request unavailable");
  if(action==="publish"){
   const existing=await db().rpc("yotion_admin_get_website_demo",{p_request_id:id});
   if(existing.error||!existing.data)throw Error("No demo");
   const result=await db().rpc("yotion_admin_publish_website_demo",{p_request_id:id});
   if(result.error||result.data!==true)throw Error("Publish failed");
   const status=await db().rpc("yotion_admin_update_demo_request",{p_id:id,p_status:"ready",p_note:"Personalised website demonstration published",p_demo_url:null});
   if(status.error)throw Error("Status update failed");
   return back(request,id,"published");
  }
  if(action!=="create")return back(request,id,"invalid");
  const school=String(f.get("school")||"").trim(),slug=String(f.get("slug")||"").trim().toLowerCase(),theme=String(f.get("theme")||"green"),headline=String(f.get("headline")||"").trim(),intro=String(f.get("intro")||"").trim(),lessons=String(f.get("lessons")||"").trim(),areas=String(f.get("areas")||"").trim();
  if(!school||!headline||!intro||!slug.match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)||slug.length>80||school.length>120||headline.length>180||intro.length>600||lessons.length>2500||areas.length>1000)return back(request,id,"invalid");
  const existing=await db().rpc("yotion_admin_get_website_demo",{p_request_id:id});
  if(existing.error)throw existing.error;
  // Preserve the existing access token when editing. New tokens are generated only for a new demo.
  // The full token is retained in the saved demo URL on the request, never in the demo RPC response.
  let token="";
  const oldUrl=String(requestData.request.demo_url||"");
  if(existing.data&&oldUrl)token=parseDemoLink(oldUrl)?.token||"";
  if(existing.data&&!token)return back(request,id,"missingtoken");
  if(!token)token=randomBytes(24).toString("base64url");
  const hash=createHash("sha256").update(token).digest("hex");
  const upsert=await db().rpc("yotion_admin_upsert_website_demo",{p_request_id:id,p_slug:slug,p_school:school,p_theme:theme,p_headline:headline,p_intro:intro,p_lessons:lessons,p_areas:areas,p_email:String(requestData.request.email),p_access_hash:hash});
  if(upsert.error||upsert.data!==true)throw upsert.error||Error("Unable to save demo");
  const url=demoLink(slug,token);
  const saved=await db().rpc("yotion_admin_update_demo_request",{p_id:id,p_status:"preparing",p_note:"Personalised demonstration draft saved",p_demo_url:url});
  if(saved.error)throw saved.error;
  return back(request,id,"saved");
 }catch(e){console.error("Yotion demo creation failed",e);return back(request,id,"failed")}
}
