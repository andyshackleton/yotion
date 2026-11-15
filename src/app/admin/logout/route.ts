import {NextRequest,NextResponse} from "next/server";
import {adminBaseUrl} from "../../../lib/yotion-admin-url";

export async function POST(request:NextRequest){
 // Logout is deliberately idempotent. Avoid relying on the internal Vercel
 // request origin, which may differ from the browser-facing hostname.
 // Browser Fetch Metadata protects against cross-site form submissions.
 const site=request.headers.get("sec-fetch-site");
 if(site==="cross-site")return new NextResponse("Forbidden",{status:403});
 const response=NextResponse.redirect(new URL("/admin/login",adminBaseUrl()),303);
 response.cookies.set("yotion_admin","",{path:"/admin",httpOnly:true,secure:true,sameSite:"lax",maxAge:0});
 return response;
}
