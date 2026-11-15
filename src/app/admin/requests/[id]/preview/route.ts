import {NextRequest,NextResponse} from "next/server";
import {isAdmin} from "../../../../../lib/yotion-admin-auth";
import {db} from "../../../../../lib/yotion-db";
import {starterWebsiteConfig,isWebsiteConfig} from "../../../../../lib/yotion-website-config";
import {renderDrivingSchoolWebsite} from "../../../../../lib/yotion-driving-school-template";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 if(!await isAdmin())return NextResponse.redirect(new URL("/admin/login",request.url));
 const {id}=await context.params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Invalid request",{status:400});
 const result=await db().rpc("yotion_admin_get_website_demo",{p_request_id:id});
 if(result.error){console.error("Admin preview failed",result.error);return new NextResponse("Preview unavailable",{status:503})}
 const website=result.data;
 if(!website)return new NextResponse("No website draft exists for this request",{status:404});
 const fallback=starterWebsiteConfig({schoolName:String(website.school_name||""),colour:String(website.theme||"green"),email:String(website.contact_email||"")});
 fallback.hero.headline=String(website.headline||fallback.hero.headline);
 fallback.hero.description=String(website.introduction||fallback.hero.description);
 fallback.lessons.intro=String(website.lesson_details||fallback.lessons.intro);
 fallback.teachingAreas.areas=String(website.teaching_areas||"").split(/[,\n]/).map((x:string)=>x.trim()).filter(Boolean);
 const config=isWebsiteConfig(website.config)?website.config:fallback;
 return new NextResponse(renderDrivingSchoolWebsite(config,{published:false}),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow","Referrer-Policy":"no-referrer","X-Frame-Options":"DENY"}});
}
