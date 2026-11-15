import {NextRequest,NextResponse} from "next/server";
import {db} from "../../lib/yotion-db";
import {starterWebsiteConfig,isWebsiteConfig} from "../../lib/yotion-website-config";
import {renderDrivingSchoolWebsite} from "../../lib/yotion-driving-school-template";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
 const hostname=(request.headers.get("host")||"").split(":")[0].toLowerCase();
 if(!/^[a-z0-9-]+\.yotion\.co\.uk$/.test(hostname))
  return new NextResponse("Not found",{status:404});
 let website:Record<string,unknown>|null=null;
 try{
  const result=await db().rpc("yotion_resolve_published_website_domain",{p_hostname:hostname});
  if(result.error)throw result.error;
  website=result.data;
 }catch(error){
  console.error("Published website lookup failed",error);
  return new NextResponse("Website temporarily unavailable",{status:503});
 }
 if(!website)return new NextResponse("Website not available",{status:404});
 const fallback=starterWebsiteConfig({
  schoolName:String(website.school_name||""),
  colour:String(website.theme||"green"),
  email:String(website.contact_email||"")
 });
 fallback.hero.headline=String(website.headline||fallback.hero.headline);
 fallback.hero.description=String(website.introduction||fallback.hero.description);
 fallback.lessons.intro=String(website.lesson_details||fallback.lessons.intro);
 fallback.teachingAreas.areas=String(website.teaching_areas||"").split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
 const config=isWebsiteConfig(website.config)
  ? {...website.config,branding:{...website.config.branding,...fallback.branding}}
  : fallback;
 return new NextResponse(renderDrivingSchoolWebsite(config,{published:true}),{
  headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}
 });
}
