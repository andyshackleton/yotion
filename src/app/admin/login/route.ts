import { adminShell } from "../../../lib/yotion-admin-shell";
import {isSameOriginPost} from "../../../lib/yotion-admin-csrf";
import {adminBaseUrl} from "../../../lib/yotion-admin-url";
import {NextRequest,NextResponse} from "next/server";
import {adminEmail,newAdminToken,isAdmin} from "../../../lib/yotion-admin-auth";
export const dynamic="force-dynamic";
const html=(message:string)=>adminShell({title:"Sign in",styles:`
.admin-access h1{font-size:1.65rem;line-height:1.2;margin:0;font-weight:500}.admin-access p{margin:.6rem 0 1rem}
.admin-access input,.admin-access button{display:block;width:100%;min-height:44px;padding:.55rem .7rem;border-radius:6px;font:400 15px var(--yotion-font)}
.admin-access input{border:1px solid #85988b}.admin-access button{margin-top:.75rem;color:white;background:#175e4c;border:1px solid #175e4c;cursor:pointer}
`,body:`<h1>Sign in</h1><p>Enter your administrator email to receive a secure sign-in link.</p><form method="post"><input aria-label="Administrator email" name="email" type="email" autocomplete="email" placeholder="Email address" required><button type="submit">Email sign-in link</button></form><p role="status">${message}</p>`});
const response=(message:string,status=200)=>new NextResponse(html(message),{status,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Frame-Options":"DENY"}});
export async function GET(request:NextRequest){if(await isAdmin())return NextResponse.redirect(new URL("/admin",request.url));return response("")}
export async function POST(request:NextRequest){
 const origin=request.headers.get("origin");if(!isSameOriginPost(request))return response("Unable to process this request.",403);
 const data=await request.formData();const email=String(data.get("email")||"").trim().toLowerCase();
 if(email===adminEmail()){
  const token=newAdminToken();const url=new URL("/admin/verify",adminBaseUrl());url.searchParams.set("token",token);
  try{const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.YOTION_FROM_EMAIL,to:[adminEmail()],subject:"Your Yotion admin sign-in link",html:"<p>Use this link to sign in to Yotion admin. It expires in 30 minutes.</p><p><a href='"+url.toString()+"'>Sign in to Yotion</a></p><p>If you didn't request this, ignore this email.</p>"})});if(!sent.ok){console.error("Admin sign-in email failed",sent.status);return response("Unable to send the sign-in link right now.",503)}}catch(e){console.error("Admin sign-in email error",e);return response("Unable to send the sign-in link right now.",503)}
 }
 return response("If this address is authorised, a sign-in link has been sent.");
}