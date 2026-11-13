import {isSameOriginPost} from "../../../lib/yotion-admin-csrf";
import {adminBaseUrl} from "../../../lib/yotion-admin-url";
import {NextRequest,NextResponse} from "next/server";
import {adminEmail,newAdminToken,isAdmin} from "../../../lib/yotion-admin-auth";
export const dynamic="force-dynamic";
const html=(message:string)=>`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Yotion admin sign in</title><style>body{background:#f7f9f4;color:#19332c;font:16px/1.5 system-ui}main{max-width:440px;margin:12vh auto;background:white;padding:36px;border-radius:18px}h1{font:normal 40px Georgia,serif}input,button{padding:14px;font:inherit;box-sizing:border-box;width:100%;margin:8px 0}button{background:#175e4c;color:white;border:0;border-radius:8px}</style></head><body><main><h1>Yotion admin</h1><p>Enter your administrator email to receive a secure sign-in link.</p><form method="post"><input name="email" type="email" autocomplete="email" placeholder="Email address" required><button type="submit">Email sign-in link</button></form><p role="status">${message}</p></main></body></html>`;
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