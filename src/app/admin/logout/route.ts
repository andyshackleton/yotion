import {NextRequest,NextResponse} from "next/server";
import {adminBaseUrl} from "../../../lib/yotion-admin-url";

export async function POST(request:NextRequest){
 const canonical=adminBaseUrl();
 const origin=request.headers.get("origin");
 const fetchSite=request.headers.get("sec-fetch-site");
 // Compare browser origins against the public hostname, not the internal
 // deployment URL used by Vercel's reverse proxy.
 if(origin){
  let source:URL;
  try{source=new URL(origin)}catch{return new NextResponse("Forbidden",{status:403})}
  const allowedHosts=new Set([canonical.hostname,"yotion.co.uk","www.yotion.co.uk"]);
  if(source.protocol!=="https:"||!allowedHosts.has(source.hostname)||source.port){
   console.warn("Yotion logout rejected unexpected origin host",source.hostname);
   return new NextResponse("Forbidden",{status:403});
  }
 }else if(fetchSite&&fetchSite!=="same-origin"&&fetchSite!=="same-site"){
  return new NextResponse("Forbidden",{status:403});
 }
 const response=NextResponse.redirect(new URL("/admin/login",canonical),303);
 response.cookies.set("yotion_admin","",{path:"/admin",httpOnly:true,secure:true,sameSite:"lax",maxAge:0});
 return response;
}
