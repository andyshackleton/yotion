import {NextRequest} from "next/server";
import {lookupToken} from "@/lib/yotion-db";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
const statuses=["received","reviewing","preparing","ready","approved","activated"];
export async function GET(request:NextRequest){
 const token=new URL(request.url).searchParams.get("token")||"";
 let record:null|Record<string,unknown>=null;
 try{record=await lookupToken(token)}catch(error){console.error("Progress lookup failed",error)}
 const stage=record?statuses.indexOf(String(record.status)):-1;
 const labels=["Request received","Request review","Preparing your demonstration","Ready for your review","Demo approved","Website activation"];
 const steps=labels.map((label,i)=>"<li class='"+(i<=stage?"done":"")+"'><span>"+(i<stage?"✓":i+1)+"</span><strong>"+label+"</strong></li>").join("");
 const ready=record&&record.status==="ready"&&typeof record.demo_url==="string"&&/^https:\/\//.test(record.demo_url);
 const body=record?"<p class='eyebrow'>YOUR PERSONALISED DEMONSTRATION</p><h1>"+esc(String(record.school))+"</h1><p class='lead'>"+(stage>=3?"Your demonstration has reached the review stage.":"We're looking after your request. You can return here whenever you'd like to check progress.")+"</p><ol>"+steps+"</ol>"+(ready?"<a class='btn' rel='noopener noreferrer' href='"+esc(String(record.demo_url))+"'>View your demonstration</a>":"<p class='note'>We aim to review requests within one working day and prepare demonstrations within two working days once we have the details needed. We'll email you when there's an important update.</p>"):"<h1>Your private progress link</h1><p class='lead'>This link has expired or is no longer available. Please reply to your Yotion confirmation email to request a new secure link.</p>";
 const html="<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><meta name='robots' content='noindex,nofollow'><meta name='referrer' content='no-referrer'><title>Demo progress | Yotion</title><style>body{margin:0;background:#f7f9f4;color:#172e2b;font:16px/1.65 Arial,sans-serif}header,main{max-width:780px;margin:auto;padding:22px}header{font-weight:800}main{padding-top:45px;padding-bottom:70px}.eyebrow{font-size:12px;letter-spacing:2px;color:#175e4c;font-weight:700}h1{font:normal clamp(35px,5vw,56px)/1.13 Georgia,serif}.lead{font-size:18px;color:#526459}ol{list-style:none;margin:35px 0;padding:0;border:1px solid #dbe5d8;border-radius:14px;background:white}li{display:flex;gap:16px;padding:19px 22px;border-bottom:1px solid #e4eae0;color:#66746c}li:last-child{border:0}li span{width:30px;height:30px;border:1px solid #bdc9be;border-radius:50%;display:grid;place-items:center;flex-shrink:0}li.done{color:#172e2b}li.done span{background:#175e4c;color:white}.note{color:#526459}.btn{display:inline-block;padding:12px 20px;background:#175e4c;color:white;text-decoration:none;border-radius:8px}</style></head><body><header>Yotion</header><main>"+body+"</main></body></html>";
 return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store, private","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow","X-Content-Type-Options":"nosniff"}});
}
