import {NextRequest,NextResponse} from "next/server";
export function middleware(request:NextRequest){
 const host=(request.headers.get("host")||"").split(":")[0].toLowerCase();
 const url=request.nextUrl.clone();
 const canonicalAdminHost="yotion-kappa.vercel.app";
 if(url.pathname==="/admin"||url.pathname.startsWith("/admin/")){
  if(host!==canonicalAdminHost && (host==="yotion.co.uk"||host==="www.yotion.co.uk"||host.endsWith(".vercel.app"))){
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
 return NextResponse.next();
}
export const config={matcher:["/((?!_next/|api/|favicon.ico|robots.txt|sitemap.xml).*)"]};
