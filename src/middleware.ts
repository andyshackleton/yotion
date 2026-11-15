import {adminBaseUrl} from "./lib/yotion-admin-url";
import {NextRequest,NextResponse} from "next/server";
export function middleware(request:NextRequest){
 const host=(request.headers.get("host")||"").split(":")[0].toLowerCase();
 const url=request.nextUrl.clone();
 const canonicalAdmin=adminBaseUrl();
 const canonicalAdminHost=canonicalAdmin.hostname;
 if(url.pathname==="/admin"||url.pathname.startsWith("/admin/")){
  if(host!==canonicalAdminHost && (host==="yotion.co.uk"||host==="www.yotion.co.uk"||host==="yotion-kappa.vercel.app"||host.endsWith(".vercel.app"))){
   url.hostname=canonicalAdminHost;
   url.protocol="https:";
   url.port="";
   return NextResponse.redirect(url,307);
  }
 }
 if(host==="sample.yotion.co.uk"){
  if(url.pathname==="/")url.pathname="/sample";
  return NextResponse.rewrite(url);
 }
 if(host==="demo.yotion.co.uk"){
  if(url.pathname==="/"){url.pathname="/demo";return NextResponse.rewrite(url)}
  if(!url.pathname.startsWith("/demo/")){url.pathname="/demo"+url.pathname;return NextResponse.rewrite(url)}
 }
 if(host.endsWith(".yotion.co.uk") &&
  !["www.yotion.co.uk","sample.yotion.co.uk","demo.yotion.co.uk"].includes(host) &&
  /^[a-z0-9-]+\.yotion\.co\.uk$/.test(host)){
  if(url.pathname==="/"){url.pathname="/website";return NextResponse.rewrite(url)}
  return new NextResponse("Not found",{status:404});
 }
 return NextResponse.next();
}
export const config={matcher:["/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml).*)"]};
