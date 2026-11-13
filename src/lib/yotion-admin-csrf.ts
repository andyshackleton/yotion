import {NextRequest} from "next/server";
/** Protect state-changing admin forms while supporting Vercel's forwarded host and
 * browsers which omit Origin on form POST. Never trust a cross-site Fetch Metadata value. */
export function isSameOriginPost(request:NextRequest):boolean{
 const origin=request.headers.get("origin");
 const referer=request.headers.get("referer");
 const fetchSite=request.headers.get("sec-fetch-site");
 const hosts=[request.headers.get("x-forwarded-host"),request.headers.get("host")]
  .filter((x):x is string=>!!x).map(x=>x.toLowerCase());
 const matches=(raw:string)=>{
  try{
   const u=new URL(raw);
   return u.protocol==="https:"&&!u.username&&!u.password&&hosts.includes(u.host.toLowerCase());
  }catch{return false}
 };
 let allowed=false;
 if(fetchSite==="cross-site")allowed=false;
 else if(origin&&origin!=="null")allowed=matches(origin);
 else if(referer)allowed=matches(referer);
 else allowed=fetchSite==="same-origin";
 if(!allowed)console.warn("Yotion admin form origin rejected",{
  path:request.nextUrl.pathname,
  originHost:(()=>{try{return origin?new URL(origin).host:null}catch{return "invalid"}})(),
  refererHost:(()=>{try{return referer?new URL(referer).host:null}catch{return "invalid"}})(),
  host:request.headers.get("host"),
  forwardedHost:request.headers.get("x-forwarded-host"),
  fetchSite
 });
 return allowed;
}
