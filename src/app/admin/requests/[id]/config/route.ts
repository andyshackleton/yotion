import {randomUUID} from "node:crypto";
import {isSameOriginPost} from "../../../../../lib/yotion-admin-csrf";
import {NextRequest,NextResponse} from "next/server";
import {isAdmin} from "../../../../../lib/yotion-admin-auth";
import {db} from "../../../../../lib/yotion-db";
import {type WebsiteConfig,starterWebsiteConfig,isWebsiteConfig} from "../../../../../lib/yotion-website-config";
export const dynamic="force-dynamic";
const back=(r:NextRequest,id:string,result:string)=>NextResponse.redirect(new URL("/admin/requests/"+id+(r.nextUrl.searchParams.get("return")==="website"?"/website":"")+"?config="+result,r.url),303);
const value=(f:FormData,k:string,max:number)=>String(f.get(k)||"").trim().slice(0,max);
const lines=(s:string)=>s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url),303);
 if(!isSameOriginPost(request))return new NextResponse("Forbidden",{status:403});
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 try{
  const f=await request.formData();
  const [demo,req]=await Promise.all([db().rpc("yotion_admin_get_website_demo",{p_request_id:id}),db().rpc("yotion_admin_get_demo_request",{p_id:id})]);
  if(demo.error||req.error||!demo.data||!req.data?.request)return back(request,id,"missing");
  const original:WebsiteConfig=isWebsiteConfig(demo.data.config)?demo.data.config:starterWebsiteConfig({schoolName:String(demo.data.school_name),colour:String(demo.data.theme),email:String(req.data.request.email)});
  const config=structuredClone(original);
  config.hero.eyebrow=value(f,"eyebrow",100);
  config.hero.headline=value(f,"headline",180);
  config.hero.headlineAccent=value(f,"headline_accent",180);
  config.hero.description=value(f,"intro",600);
  config.hero.primaryCtaLabel=value(f,"cta",70);
  config.lessons.heading=value(f,"lessons_heading",100);
  config.lessons.intro=value(f,"lessons_intro",1200);
  config.lessons.items=lines(value(f,"lessons",3500)).slice(0,15).map((line,i)=>{const [title,price,description]=line.split("|").map(x=>x.trim());return{id:String(i+1),title:(title||"Lesson").slice(0,100),price:(price||"").slice(0,50),description:(description||"").slice(0,500)}});
  if(f.has("instructor_name"))config.instructor.name=value(f,"instructor_name",100);
  config.instructor.heading=value(f,"instructor_heading",100);
  config.instructor.biography=value(f,"biography",1800);
  config.instructor.profileNoteHeading=value(f,"profile_note_heading",120);
  config.instructor.profileNote=value(f,"profile_note",1200);
  const photoUrl=value(f,"instructor_photo_url",1500);
  if(photoUrl&&!/^https:\/\/[^\s]+$/i.test(photoUrl))return back(request,id,"invalid");
  config.instructor.photoUrl=photoUrl||undefined;
  config.teachingAreas.heading=value(f,"areas_heading",100);
  config.teachingAreas.areas=lines(value(f,"areas",1200)).slice(0,40);
  config.teachingAreas.schedule=value(f,"teaching_schedule",600);
  config.reviews.heading=value(f,"reviews_heading",100);
  config.reviews.items=lines(value(f,"reviews",2500)).slice(0,12).map((line,i)=>{const [quote,attribution,theme,milestone,passDate]=line.split("|").map(x=>x.trim());return{id:String(i+1),quote:(quote||"").slice(0,600),attribution:(attribution||"").slice(0,100),theme:theme?.slice(0,60),milestone:milestone?.slice(0,100),passDate:passDate?.slice(0,60)}});
  config.faq.heading=value(f,"faq_heading",100);
  config.faq.items=lines(value(f,"faq",3500)).slice(0,20).map((line,i)=>{const [question,answer]=line.split("|").map(x=>x.trim());return{id:String(i+1),question:(question||"").slice(0,250),answer:(answer||"").slice(0,700)}});
  if(f.has("knowledge_topic")){const topics=f.getAll("knowledge_topic").map(x=>String(x).trim());
  const questions=f.getAll("knowledge_question").map(x=>String(x).trim());
  const answers=f.getAll("knowledge_answer").map(x=>String(x).trim());
  const ids=f.getAll("knowledge_id").map(x=>String(x).trim());
  if(topics.length!==questions.length||questions.length!==answers.length||answers.length!==ids.length||topics.length>60)return back(request,id,"invalid");
  const knowledge=[];
  const seenIds=new Set<string>();
  for(let i=0;i<topics.length;i++){
   if(!topics[i]&&!questions[i]&&!answers[i])continue;
   if(!topics[i]||!questions[i]||(f.has("knowledge_approved_"+i)&&!answers[i])||topics[i].length>100||questions[i].length>250||answers[i].length>1200)return back(request,id,"invalid");
   const entryId=ids[i]&&!seenIds.has(ids[i])?ids[i]:randomUUID();
   seenIds.add(entryId);
   knowledge.push({id:entryId,topic:topics[i],question:questions[i],answer:answers[i],approved:f.has("knowledge_approved_"+i)});
  }
  config.assistant.knowledge=knowledge;}
  if(f.has("assistant_gaps"))config.assistant.unansweredQuestions=[...new Set(lines(value(f,"assistant_gaps",6000)).slice(0,50).map(x=>x.slice(0,250)))];
  if(f.has("assistant_welcome"))config.assistant.welcomeMessage=value(f,"assistant_welcome",300);
  if(f.has("assistant_fallback"))config.assistant.fallbackMessage=value(f,"assistant_fallback",500)||"I don’t have a confirmed answer to that question. Please use the enquiry form to ask the instructor.";
  if(f.has("response_time"))config.contact.responseTime=value(f,"response_time",160);
  config.contact.heading=value(f,"contact_heading",100);
  config.contact.description=value(f,"contact_intro",600);
  config.contact.email=value(f,"contact_email",250);
  if(f.has("facebook_url")&&f.has("instagram_url")){
   const socials={...config.contact.socials,facebook:value(f,"facebook_url",1500),instagram:value(f,"instagram_url",1500)};
   if(f.has("youtube_url"))socials.youtube=value(f,"youtube_url",1500);
   if(f.has("tiktok_url"))socials.tiktok=value(f,"tiktok_url",1500);
   for(const [platform,link] of Object.entries(socials)){
    if(!link)continue;
    let url:URL;
    try{url=new URL(link)}catch{return back(request,id,"invalid")}
    if(url.protocol!=="https:"||url.username||url.password||![platform+".com","www."+platform+".com","m."+platform+".com"].includes(url.hostname)||url.pathname==="/")return back(request,id,"invalid");
   }
   config.contact.socials=socials;
  }
  if(!config.hero.headline||!config.contact.email||!config.contact.email.includes("@"))return back(request,id,"invalid");
  const result=await db().rpc("yotion_admin_save_website_config",{p_request_id:id,p_config:config});
  if(result.error||result.data!==true)throw result.error||Error("Save failed");
  // Saving structured content returns a published demo to draft; preserve the access URL.
  const status=await db().rpc("yotion_admin_update_demo_request",{p_id:id,p_status:"preparing",p_note:"Website sections updated; draft requires review",p_demo_url:String(req.data.request.demo_url||"")});
  if(status.error)throw status.error;
  return back(request,id,"saved");
 }catch(e){console.error("Yotion website config save failed",e);return back(request,id,"failed")}
}
