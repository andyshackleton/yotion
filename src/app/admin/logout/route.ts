import {NextRequest,NextResponse} from "next/server";
import {adminBaseUrl} from "../../../lib/yotion-admin-url";

export async function POST(request:NextRequest){
 const canonical=adminBaseUrl();
 const origin=request.headers.get("origin");
 // Vercel may expose an internal deployment URL to the route even when the
 // browser posts from the configured public admin domain.
 if(origin&&origin!==canonical.origin&&origin!==new URL(request.url).origin){
  return new NextResponse("Forbidden",{status:403});
 }
 const response=NextResponse.redirect(new URL("/admin/login",canonical),303);
 response.cookies.set("yotion_admin","",{path:"/admin",httpOnly:true,secure:true,sameSite:"lax",maxAge:0});
 return response;
}
