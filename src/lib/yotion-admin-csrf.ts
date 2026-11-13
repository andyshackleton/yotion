import {NextRequest} from "next/server";
/** Compare the browser's Origin with the public Host, not request.url, which can
 * be an internal deployment URL behind Vercel's proxy. */
export function isSameOriginPost(request:NextRequest):boolean{
 const origin=request.headers.get("origin");
 const host=request.headers.get("host");
 if(!origin||!host)return false;
 try{
  const url=new URL(origin);
  return url.protocol==="https:" && url.host.toLowerCase()===host.toLowerCase() && !url.username && !url.password;
 }catch{return false}
}
