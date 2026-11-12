import {NextRequest,NextResponse} from "next/server";
import {verifyLoginToken,newSession,adminCookie} from "../../../lib/yotion-admin-auth";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){const token=new URL(request.url).searchParams.get("token")||"";if(!verifyLoginToken(token))return new NextResponse("This sign-in link is invalid or expired.",{status:401,headers:{"Cache-Control":"no-store"}});const response=NextResponse.redirect(new URL("/admin",request.url));const c=adminCookie(newSession());response.cookies.set(c.name,c.value,c.options);response.headers.set("Cache-Control","no-store");return response}
