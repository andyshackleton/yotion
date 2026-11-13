import {NextRequest,NextResponse} from "next/server";
import {isAdmin} from "../../../../../lib/yotion-admin-auth";
import {db} from "../../../../../lib/yotion-db";
import {starterWebsiteConfig,isWebsiteConfig,BRAND_COLOURS} from "../../../../../lib/yotion-website-config";
export const dynamic="force-dynamic";
const back=(r:NextRequest,id:string,result:string)=>NextResponse.redirect(new URL("/admin/requests/"+id+"?config="+result,r.url),303);
const value=(f:FormData,k:string,max:number)=>String(f.get(k)||"").trim().slice(0,max);
const lines=(s:string)=>s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
export async function POST(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url),303);
 if(request.headers.get("origin")!==new URL(request.url).origin)return new NextResponse("Forbidden",{status:403});
 const {id}=await context.params;if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 try{
  const f=await request.formData();
  const [demo,req]=await Promise.all([db().rpc("yotion_admin_get_website_demo",{p_request_id:id}),db().rpc("yotion_admin_get_demo_request",{p_id:id})]);
  if(demo.error||req.error||!demo.data||!req.data?.request)return back(request,id,"missing");
  const original=isWebsiteConfig(demo.data.config)?demo.data.config:starterWebsiteConfig({schoolName:String(demo.data.school_name),colour:String(demo.data.theme),email:String(req.data.request.email)});
  const colour=value(f,"colour",30);if(!BRAND_COLOURS.includes(colour as typeof BRAND_COLOURS[number]))return back(request,id,"invalid");
  const config=structuredClone(original);
  config.branding.schoolName=value(f,"school",120);
  config.branding.colour=colour as typeof config.branding.colour;
  config.hero.eyebrow=value(f,"eyebrow",100);
  config.hero.headline=value(f,"headline",180);
  config.hero.description=value(f,"intro",600);
  config.hero.primaryCtaLabel=value(f,"cta",70);
  config.lessons.heading=value(f,"lessons_heading",100);
  config.lessons.intro=value(f,"lessons_intro",1200);
  config.lessons.items=lines(value(f,"lessons",3500)).slice(0,15).map((line,i)=>{const [title,price,description]=line.split("|").map(x=>x.trim());return{id:String(i+1),title:(title||"Lesson").slice(0,100),price:(price||"").slice(0,50),description:(description||"").slice(0,500)}});
  config.instructor.heading=value(f,"instructor_heading",100);
  config.instructor.biography=value(f,"biography",1800);
  config.teachingAreas.heading=value(f,"areas_heading",100);
  config.teachingAreas.areas=lines(value(f,"areas",1200)).slice(0,40);
  config.reviews.heading=value(f,"reviews_heading",100);
  config.reviews.items=lines(value(f,"reviews",2500)).slice(0,12).map((line,i)=>{const [quote,attribution]=line.split("|").map(x=>x.trim());return{id:String(i+1),quote:(quote||"").slice(0,600),attribution:(attribution||"").slice(0,100)}});
  config.faq.heading=value(f,"faq_heading",100);
  config.faq.items=lines(value(f,"faq",3500)).slice(0,20).map((line,i)=>{const [question,answer]=line.split("|").map(x=>x.trim());return{id:String(i+1),question:(question||"").slice(0,250),answer:(answer||"").slice(0,700)}});
  config.contact.heading=value(f,"contact_heading",100);
  config.contact.description=value(f,"contact_intro",600);
  config.contact.email=value(f,"contact_email",250);
  if(!config.branding.schoolName||!config.hero.headline||!config.contact.email||!config.contact.email.includes("@"))return back(request,id,"invalid");
  const result=await db().rpc("yotion_admin_save_website_config",{p_request_id:id,p_config:config});
  if(result.error||result.data!==true)throw result.error||Error("Save failed");
  // Saving structured content returns a published demo to draft; preserve the access URL.
  const status=await db().rpc("yotion_admin_update_demo_request",{p_id:id,p_status:"preparing",p_note:"Website sections updated; draft requires review",p_demo_url:String(req.data.request.demo_url||"")});
  if(status.error)throw status.error;
  return back(request,id,"saved");
 }catch(e){console.error("Yotion website config save failed",e);return back(request,id,"failed")}
}
