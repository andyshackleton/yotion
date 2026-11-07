import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const safe=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
export async function POST(request:NextRequest){
  const key=process.env.RESEND_API_KEY;
  if(!key)return NextResponse.json({error:"Demo requests are temporarily unavailable. Please try again later."},{status:503});
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return NextResponse.json({error:"Invalid request."},{status:400})}
  if(body.website_url)return NextResponse.json({ok:true});
  const name=safe(body.name,100),school=safe(body.school,140),email=safe(body.email,254);
  const postcode=safe(body.postcode,30),site=safe(body.currentWebsite,250),notes=safe(body.notes,1200);
  if(!name||!school||!emailPattern.test(email)||!body.consent)return NextResponse.json({error:"Please enter your name, school name, valid email and confirm the privacy notice."},{status:400});
  const rows=[["Name",name],["Driving school",school],["Email",email],["Town or postcode",postcode],["Existing website",site],["Details",notes]].map(([label,value])=>"<tr><th style=\"text-align:left;padding:8px;border-bottom:1px solid #ddd\">"+label+"</th><td style=\"padding:8px;border-bottom:1px solid #ddd\">"+escapeHtml(value)+"</td></tr>").join("");
  let response:Response;
  try{response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.YOTION_FROM_EMAIL||"Yotion <hello@yotion.co.uk>",to:[process.env.YOTION_ENQUIRY_TO||"andy@drivingschoolfinder.co.uk"],reply_to:email,subject:"Yotion personalised demo request — "+school,html:"<h2>New Yotion personalised demo request</h2><table>"+rows+"</table>"})})}catch{return NextResponse.json({error:"We couldn't send your request. Please try again."},{status:502})}
  if(!response.ok){console.error("Resend delivery failed",response.status);return NextResponse.json({error:"We couldn't send your request. Please try again."},{status:502})}
  return NextResponse.json({ok:true});
}
