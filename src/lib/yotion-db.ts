import {Pool} from "pg";
import {createHash,randomBytes} from "node:crypto";
let pool:Pool|undefined;
export function db(){const url=process.env.YOTION_DATABASE_URL;if(!url)throw new Error("YOTION_DATABASE_URL is not configured");return pool??(pool=new Pool({connectionString:url,ssl:{rejectUnauthorized:false},max:3,connectionTimeoutMillis:5000}));}
export function newToken(){const token=randomBytes(32).toString("base64url");return {token,hash:hashToken(token)};}
export function hashToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function lookupToken(token:string){if(!/^[A-Za-z0-9_-]{40,60}$/.test(token))return null;const result=await db().query(`select r.id,r.school,r.status,r.created_at,r.reviewed_at,r.ready_at,r.demo_url,t.expires_at from yotion.access_tokens t join yotion.demo_requests r on r.id=t.request_id where t.token_hash=$1 and t.revoked_at is null and t.expires_at>now() limit 1`,[hashToken(token)]);return result.rows[0]??null;}
