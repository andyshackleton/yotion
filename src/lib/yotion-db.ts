import {createClient} from "@supabase/supabase-js";
import {createHash,randomBytes} from "node:crypto";
export function db(){const url=process.env.YOTION_SUPABASE_URL;const key=process.env.YOTION_SUPABASE_SECRET_KEY;if(!url||!key)throw new Error("Yotion Supabase configuration missing");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export function newToken(){const token=randomBytes(32).toString("base64url");return {token,hash:hashToken(token)};}
export function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function lookupToken(token:string){if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))return null;const {data,error}=await db().rpc("yotion_lookup_demo_request",{p_token_hash:hashToken(token)});if(error)throw error;return data?.[0]??null;}
