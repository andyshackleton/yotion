import {NextRequest,NextResponse} from "next/server";
import {db,newToken} from "@/lib/yotion-db";
export const runtime="nodejs";
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safe=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
async function sendEmail(to:string,subject:string,html:string,replyTo?:string){
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.YOTION_FROM_EMAIL,to:[to],...(replyTo?{reply_to:replyTo}:{}),subject,html})});
 if(!response.ok){console.error("Resend failed",response.status);throw new Error("Email delivery failed");}
}
export async function POST(request:NextRequest){
 if(!process.env.RESEND_API_KEY||!process.env.YOTION_FROM_EMAIL)return NextResponse.json({error:"Demo requests are temporarily unavailable."},{status:503});
 let body:Record<string,unknown>;
 try{body=await request.json()}catch{return NextResponse.json({error:"Invalid request."},{status:400})}
 if(body.website_url)return NextResponse.json({ok:true});
 const name=safe(body.name,100),school=safe(body.school,140),email=safe(body.email,254);
 const postcode=safe(body.postcode,30),site=safe(body.currentWebsite,250),notes=safe(body.notes,1200);
 if(!name||!school||!emailPattern.test(email)||!body.consent)return NextResponse.json({error:"Please enter your name, school name, valid email and confirm the privacy notice."},{status:400});
 if(!process.env.YOTION_DATABASE_URL){
  const rows=[["Name",name],["School",school],["Email",email],["Town / postcode",postcode],["Website",site],["Notes",notes]].map(([k,v])=>"<tr><th style='text-align:left;padding:8px'>"+k+"</th><td style='padding:8px'>"+escapeHtml(v)+"</td></tr>").join("");
  try{await sendEmail(process.env.YOTION_ENQUIRY_TO||"andy@drivingschoolfinder.co.uk","Yotion demo request — "+school,"<h2>New demo request</h2><table>"+rows+"</table>",email);return NextResponse.json({ok:true,progressEnabled:false})}catch{return NextResponse.json({error:"We couldn't send your request. Please try again."},{status:502})}
 }
 const {token,hash}=newToken();let id:string;
 try{
  const client=await db().connect();
  try{
   await client.query("begin");
   const row=await client.query("insert into yotion.demo_requests(name,school,email,postcode,current_website,notes) values($1,$2,$3,$4,$5,$6) returning id",[name,school,email,postcode,site,notes]);id=row.rows[0].id;
   await client.query("insert into yotion.access_tokens(request_id,token_hash,expires_at) values($1,$2,now()+interval '7 days')",[id,hash]);
   await client.query("insert into yotion.status_events(request_id,status,note) values($1,'received','Request submitted')",[id]);
   await client.query("commit");
  }catch(error){await client.query("rollback");throw error}finally{client.release()}
 }catch(error){console.error("Yotion database request failed",error);return NextResponse.json({error:"We couldn't save your request. Please try again."},{status:503})}
 const origin=process.env.YOTION_SITE_URL||new URL(request.url).origin;
 const link=origin+"/demo/progress?token="+encodeURIComponent(token);
 const rows=[["Name",name],["School",school],["Email",email],["Town / postcode",postcode],["Website",site],["Notes",notes]].map(([k,v])=>"<tr><th style='text-align:left;padding:8px'>"+k+"</th><td style='padding:8px'>"+escapeHtml(v)+"</td></tr>").join("");
 let mailWarning=false;
 try{await sendEmail(process.env.YOTION_ENQUIRY_TO||"andy@drivingschoolfinder.co.uk","Yotion demo request — "+school,"<h2>New demo request</h2><table>"+rows+"</table><p>Request ID: "+id+"</p>",email)}catch{mailWarning=true}
 try{await sendEmail(email,"We've received your Yotion demo request","<p>Hello "+escapeHtml(name)+",</p><p>Thank you for requesting a personalised demonstration for "+escapeHtml(school)+". We'll review your request within one working day and aim to prepare your demo within two working days once we have the information needed.</p><p><a href='"+escapeHtml(link)+"'>View your private request progress</a></p><p>This link expires after seven days. Keep it private. If it expires, reply to this email to request a new link.</p><p>Yotion</p>")}catch{mailWarning=true}
 return NextResponse.json({ok:true,mailWarning});
}
