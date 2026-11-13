import {NextRequest,NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {db} from "../../../../lib/yotion-db";
import {starterWebsiteConfig,isWebsiteConfig} from "../../../../lib/yotion-website-config";
import {renderDrivingSchoolWebsite} from "../../../../lib/yotion-driving-school-template";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,context:{params:Promise<{slug:string,token:string}>}){
 const {slug,token}=await context.params;
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!/^[A-Za-z0-9_-]{32}$/.test(token))return new NextResponse("Not found",{status:404});
 let demo:Record<string,unknown>|null=null;
 try{const {data,error}=await db().rpc("yotion_get_website_demo",{p_slug:slug,p_access_hash:createHash("sha256").update(token).digest("hex")});if(error)throw error;demo=data}catch(e){console.error("Yotion demo lookup failed",e)}
 if(!demo)return new NextResponse("This demonstration is not available.",{status:404,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
 const isPublished=demo.status==="published";
 const fallback=starterWebsiteConfig({schoolName:String(demo.school_name||""),colour:String(demo.theme||"green"),email:String(demo.contact_email||"")});
 fallback.hero.headline=String(demo.headline||fallback.hero.headline);
 fallback.hero.description=String(demo.introduction||fallback.hero.description);
 fallback.lessons.intro=String(demo.lesson_details||fallback.lessons.intro);
 fallback.teachingAreas.areas=String(demo.teaching_areas||"").split(/[,\\n]/).map(x=>x.trim()).filter(Boolean);
 const config=isWebsiteConfig(demo.config)?demo.config:fallback;
 const html=renderDrivingSchoolWebsite(config,{published:isPublished});
 return new NextResponse(html,{headers:{"Content-Type":"text/html; charset=utf-8","X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}});
}
