import {randomUUID} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {isAdmin} from "../../../../../../lib/yotion-admin-auth";
import {isSameOriginPost} from "../../../../../../lib/yotion-admin-csrf";
import {isWebsiteConfig} from "../../../../../../lib/yotion-website-config";
import {db} from "../../../../../../lib/yotion-db";
export const dynamic="force-dynamic";
const back=(r:NextRequest,id:string,status:string)=>NextResponse.redirect(new URL("/admin/requests/"+id+"/knowledge?save="+status,r.url),303);
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url),303);
 if(!isSameOriginPost(request))return new NextResponse("Forbidden",{status:403});
 const {id}=await context.params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 try{
  const form=await request.formData();
  const [demo,req]=await Promise.all([db().rpc("yotion_admin_get_website_demo",{p_request_id:id}),db().rpc("yotion_admin_get_demo_request",{p_id:id})]);
  if(demo.error||req.error||!isWebsiteConfig(demo.data?.config)||!req.data?.request)return back(request,id,"failed");
  const config=structuredClone(demo.data.config);
  const ids=form.getAll("id").map(String),topics=form.getAll("topic").map(String),questions=form.getAll("question").map(String),answers=form.getAll("answer").map(String);
  if(ids.length!==topics.length||ids.length!==questions.length||ids.length!==answers.length||ids.length>60)return back(request,id,"invalid");
  const seen=new Set<string>();
  const knowledge=[];
  for(let i=0;i<ids.length;i++){
   const topic=topics[i].trim(),question=questions[i].trim(),answer=answers[i].trim(),approved=form.has("approved_"+i);
   if(!topic&&!question&&!answer&&!approved)continue;
   if(!topic||!question||topic.length>100||question.length>250||answer.length>1200||(approved&&!answer))return back(request,id,"invalid");
   const stableId=ids[i]&&!seen.has(ids[i])?ids[i]:randomUUID();seen.add(stableId);
   knowledge.push({id:stableId,topic,question,answer,approved});
  }
  config.assistant.knowledge=knowledge;
  const gaps=String(form.get("gaps")||"");
  if(gaps.length>6000)return back(request,id,"invalid");
  config.assistant.unansweredQuestions=[...new Set(gaps.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,50).map(x=>x.slice(0,250)))];
  const welcome=String(form.get("welcome")||"").trim(),fallback=String(form.get("fallback")||"").trim();
  if(welcome.length>300||fallback.length>500)return back(request,id,"invalid");
  config.assistant.welcomeMessage=welcome;
  config.assistant.fallbackMessage=fallback||"I don’t have a confirmed answer to that question. Please use the enquiry form to ask the instructor.";
  const result=await db().rpc("yotion_admin_save_website_config",{p_request_id:id,p_config:config});
  if(result.error||result.data!==true)throw result.error||Error("Save failed");
  const status=await db().rpc("yotion_admin_update_demo_request",{p_id:id,p_status:"preparing",p_note:"Knowledge base updated; draft requires review",p_demo_url:String(req.data.request.demo_url||"")});
  if(status.error)throw status.error;
  return back(request,id,"saved");
 }catch(e){console.error("Yotion knowledge save failed",e);return back(request,id,"failed")}
}
