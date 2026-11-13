import {createHmac,randomBytes,timingSafeEqual} from "node:crypto";
import {cookies} from "next/headers";
const ADMIN_EMAIL=(process.env.YOTION_ADMIN_EMAIL||"andy@drivingschoolfinder.co.uk").toLowerCase();
const key=()=>process.env.YOTION_ADMIN_SESSION_SECRET||process.env.YOTION_SUPABASE_SECRET_KEY||"";
const sign=(value:string)=>createHmac("sha256",key()).update(value).digest("base64url");
export function adminEmail(){return ADMIN_EMAIL}
export function newAdminToken(){const expiry=Date.now()+30*60*1000;const nonce=randomBytes(16).toString("hex");const payload=expiry+"."+nonce;return payload+"."+sign("login:"+payload)}
export function verifyLoginToken(token:string){const p=token.split(".");if(p.length!==3||!/^\d+$/.test(p[0])){console.warn("Yotion admin sign-in rejected: malformed token");return false}if(Number(p[0])<Date.now()){console.warn("Yotion admin sign-in rejected: expired token");return false}if(!key()){console.error("Yotion admin sign-in rejected: signing secret unavailable");return false}const valid=safeEqual(p[2],sign("login:"+p[0]+"."+p[1]));if(!valid)console.warn("Yotion admin sign-in rejected: signature mismatch");return valid}
function safeEqual(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
export function newSession(){const payload=(Date.now()+8*60*60*1000)+"."+randomBytes(16).toString("hex");return payload+"."+sign("session:"+payload)}
export async function isAdmin(){const token=(await cookies()).get("yotion_admin")?.value||"";const p=token.split(".");return !!key()&&p.length===3&&/^\d+$/.test(p[0])&&Number(p[0])>Date.now()&&safeEqual(p[2],sign("session:"+p[0]+"."+p[1]))}
export function adminCookie(token:string){return {name:"yotion_admin",value:token,options:{httpOnly:true,secure:true,sameSite:"lax" as const,path:"/admin",maxAge:8*60*60}}}
