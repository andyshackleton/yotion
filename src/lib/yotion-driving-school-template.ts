import {applySharedWebsitePolish} from "./yotion-shared-website-polish";
import type {WebsiteConfig} from "./yotion-website-config";
import {greenlightOriginalHtml} from "./yotion-greenlight-original";
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
/** Preserve the entire original Greenlight design, media and interactions.
 * Personalisation is deliberately narrow until every section has a tested mapping. */
export function renderDrivingSchoolWebsite(c:WebsiteConfig,options:{published:boolean}):string{
 const brand=esc(c.branding.schoolName);
 let page=greenlightOriginalHtml;
 // Remove the public example's theme switcher, which rewrites the school and logo on load.
 page=page.replace(/<script>\(\(\)=>\{'use strict';const themes=[\s\S]*?<\/script>/,"");
 // Reuse the sample's complete palette for the saved demo colour.
 page=page.replace('<html lang="en">','<html lang="en" data-theme="'+esc(c.branding.colour)+'">');
 // Customer demonstrations must not contain Yotion's sample-only marketing controls.
 page=page.replace(/<aside class="yotion-example-cta"[^>]*>[\s\S]*?<\/aside>/,"");
 page=page.replace(/<div class="theme-demo-bar">[\s\S]*?<\/select><\/div><\/div>/,"");
 page=page.replace(/<section class="section" id="greenlight-privacy">[\s\S]*?<\/section>/,"");
 page=page.replace(/<a[^>]*href="#greenlight-privacy"[^>]*>[\s\S]*?<\/a>/g,"");

 const replace=(from:string,to:string)=>{page=page.replace(from,()=>to)};
 replace("<title>Greenlight Driving | Automatic driving lessons in Liverpool</title>","<title>"+brand+" | Driving lessons</title>");
 replace('content="Friendly automatic driving lessons in Liverpool. Explore prices, areas and patient tuition, or ask the Greenlight assistant a quick question."','content="'+esc(c.hero.description)+'"');
 const heroParts=c.hero.headline.match(/^(Your road to)\s+(feeling confident\.?)$/i);
 replace('Your road to<br><em>feeling confident.</em>',heroParts?esc(heroParts[1])+'<br><em>'+esc(heroParts[2])+'</em>':esc(c.hero.headline));
 replace('A calm start. A clear plan. Lessons that move at your pace.',esc(c.hero.description));
 replace('AUTOMATIC DRIVING LESSONS IN LIVERPOOL',esc(c.hero.eyebrow));
 replace('Ask about your first lesson →',esc(c.hero.primaryCtaLabel)+' <span class="cta-arrow">→</span>');
 // Update prominent branding without replacing embedded scripts, data URLs or CSS.
 const nameParts=c.branding.schoolName.trim().split(/\s+/);
 const colouredName=nameParts.length>1
  ? esc(nameParts.slice(0,-1).join(" "))+" <span>"+esc(nameParts[nameParts.length-1])+"</span>"
  : brand;
 replace('Greenlight <span>Driving</span>',colouredName);
 replace('<strong>Greenlight Driving</strong>','<strong>'+brand+'</strong>');
 replace('Meet Greenlight Driving<br><small>and Alex behind the wheel!</small>','Meet '+brand+'<br><small>and '+esc(c.instructor.name||'your instructor')+' behind the wheel!</small>');
 replace('© 2026 Greenlight Driving · Demonstration','© 2026 '+brand+' · Demonstration');
 page=page.replaceAll('>Meet Alex</a>','>Meet '+esc(c.instructor.name||'your instructor')+'</a>');
 replace('AI-generated example of instructor Alex beside his teal learner car','Illustrative image of a driving instructor and learner car');
 replace('Alex and his learner car · AI-generated example image','AI-generated example image');


 // Update the content inside original sections without replacing their
 // wrappers, typography, responsive grid or scroll animations.
 const updateSection=(id:string,nextId:string,transform:(html:string)=>string)=>{
  const start=page.indexOf('id="'+id+'"');
  const end=start<0?-1:page.indexOf('id="'+nextId+'"',start+id.length);
  if(start<0||end<0)return;
  const open=page.lastIndexOf('<section',start);
  const close=page.lastIndexOf('<section',end);
  if(open<0||close<=open)return;
  page=page.slice(0,open)+transform(page.slice(open,close))+page.slice(close);
 };
 if(c.branding.schoolName.trim().toLowerCase()!=="greenlight driving"){
  updateSection("lessons","instructor",html=>{
   const cards=c.lessons.items.map(item=>'<article class="outcome"><h3>'+esc(item.title)+'</h3>'+(item.price?'<div class="sample-price">'+esc(item.price)+'</div>':'')+'<p class="sample-info">'+esc(item.description)+'</p></article>').join("");
   return html.replace('Simple lessons. Clear prices.',esc(c.lessons.heading))
    .replace(/<div class="outcome-grid">[\s\S]*?<\/div>/,
     '<div class="outcome-grid">'+cards+'</div>');
  });
  updateSection("questions","enquire",html=>{
   const faqs=c.faq.items.map(item=>'<details><summary>'+esc(item.question)+'</summary><p>'+esc(item.answer)+'</p></details>').join("");
   return html.replace("It's okay to ask.",esc(c.faq.heading))
    .replace(/<details>[\s\S]*?<\/details>(?=\s*<\/div>\s*<\/section>)/,faqs);
  });
  // Render customer-specific instructor details in the existing visual grid.
  // Never reuse Greenlight's fictional instructor photographs for customers.
  const portrait=c.instructor.photoUrl && /^https:\/\//i.test(c.instructor.photoUrl)
   ? '<figure class="instructor-portrait"><div class="face-circle"><img src="'+esc(c.instructor.photoUrl)+'" alt="'+esc(c.instructor.name||'Driving instructor')+'" loading="lazy"></div></figure>'
   : '';
  updateSection("instructor","stories",html=>{
   const intro='<div class="instructor-intro">'+portrait+'<div><div class="eyebrow">YOUR INSTRUCTOR</div><h2>'+esc(c.instructor.heading)+'</h2>'+
    (c.instructor.name?'<h3>'+esc(c.instructor.name)+'</h3>':'')+
    '<p class="lead">'+esc(c.instructor.biography)+'</p></div></div>';
   const coverage='<div class="outcome"><h3>'+esc(c.teachingAreas.heading)+'</h3><p>'+c.teachingAreas.areas.map(esc).join(' · ')+'</p></div>';
   return '<section class="section soft" id="instructor"><div class="wrap example-grid"><div>'+intro+'</div><div>'+coverage+'</div></div></section>';
  });
  // Only show testimonials actually supplied for this customer.
  updateSection("stories","questions",html=>{
   if(!c.reviews.items.length)return '';
   const cards=c.reviews.items.map(item=>{
    const initials=item.attribution.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
    return '<article class="story-card"><blockquote>“'+esc(item.quote)+'”</blockquote><div class="story-person"><span class="story-initial" aria-hidden="true">'+esc(initials)+'</span><div><strong>'+esc(item.attribution)+'</strong></div></div></article>';
   }).join('');
   return html.replace('A little more confidence.<br>A lot more independence.',esc(c.reviews.heading))
    .replace(/<div class="stories-notice">[\s\S]*?<\/div>/,'')
    .replace(/<div class="stories-grid">[\s\S]*?<\/div><\\/div><\\/section>$/,
      '<div class="stories-grid">'+cards+'</div></div></section>');
  });
 }
 // Keep the original enquiry form layout, but never send or store test details.
 // The browser explicitly confirms what would happen after production activation.
 // Preserve the sample contact layout, supporting text and example placeholders.
 page=page.replace('id="sample-form"','id="yotion-demo-enquiry"');
 page=page.replace('Review my enquiry →</button>','Send my enquiry <span class="cta-arrow">→</span></button>');
 page=page.replace('No payment or account needed.','Demonstration only — no details are sent or saved.');
 const demoScript='<script>(function(){var f=document.getElementById("yotion-demo-enquiry");if(!f)return;f.addEventListener("submit",function(e){e.preventDefault();if(!f.reportValidity())return;var n=document.getElementById("yotion-enquiry-confirmation");n.hidden=false;n.scrollIntoView({behavior:"smooth",block:"nearest"});});})();</script>';
 replace('</body>',demoScript+'</body>');
 page=page.replace(/Fictional demonstration school · Liverpool/g,'');
 page=page.replace(/<p class="footer-demo">[\s\S]*?<\/p>/g,'');


 // Personalise the lettermark and all visible assistant branding.
 const initial=Array.from(c.branding.schoolName.trim())[0]?.toLocaleLowerCase("en-GB")||"d";
 page=page.replace(/(<span class="school-icon" aria-hidden="true">)[^<]*(<\/span>)/,(_,open,close)=>open+esc(initial)+close);
 page=page.replace(/(<span class="chat-avatar" aria-hidden="true">)[^<]*(<\/span>)/,(_,open,close)=>open+esc(initial)+close);
 const shortBrand=esc(c.branding.schoolName.trim().split(/\s+/)[0]||c.branding.schoolName);
 page=page.replace(/Ask Greenlight/g,()=> 'Ask '+shortBrand);
 const iconColour:Record<string,string>={green:"#087f78",blue:"#0d397a",purple:"#6840a0",charcoal:"#333c43",emerald:"#087e60",red:"#b43e47",orange:"#bd5a26",amber:"#a66c11",pink:"#b6467a",burgundy:"#762e48",navy:"#1e4267"};
 const faviconColour=iconColour[c.branding.colour]||"#087f78";
 const icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="'+faviconColour+'"/><text x="32" y="46" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="42" fill="white">'+esc(initial)+'</text></svg>';
 page=page.replace(/<link rel="icon"[^>]*>/,
  '<link rel="icon" href="data:image/svg+xml,'+encodeURIComponent(icon)+'">');
 // The approved Greenlight assistant includes branded message bubbles,
 // topic sources and contextual links. Keep its original implementation.
 // Other websites use the config-driven assistant until it reaches parity.
 if(c.branding.schoolName.trim().toLowerCase()==="greenlight driving"){
  // Non-modal dialog allows the page to scroll while chat stays visible.
  page=page.replace("chat.showModal()","chat.show()");
 }else{
 const chatStart=page.indexOf('<script>',page.indexOf('id="chat-dialog"'));
 const chatEnd=chatStart<0?-1:page.indexOf('</script>',chatStart);
 if(chatStart>=0&&chatEnd>chatStart){
  const answers=[
   ...c.faq.items.map(x=>({question:x.question,answer:x.answer})),
   {question:"What lessons do you offer?",answer:c.lessons.items.map(x=>x.title+(x.price?' — '+x.price:'')+(x.description?'. '+x.description:'')).join(' ')||c.lessons.intro},
   {question:"Where do you teach?",answer:c.teachingAreas.areas.join(', ')||"Please contact the instructor to confirm teaching areas."},
   {question:"How do I enquire?",answer:"Use the contact form on this page. During this demonstration, it shows a confirmation rather than sending your details."}
  ];
  const script='(function(){'+
   'var d=document.getElementById("chat-dialog"),log=document.getElementById("chat-log"),suggest=document.getElementById("chat-suggestions"),form=document.getElementById("chat-form"),input=document.getElementById("chat-message");'+
   'if(!d||!log||!suggest||!form||!input)return;'+
   'var entries='+JSON.stringify(answers).replace(/</g,"\\u003c")+';'+
   'function msg(value,who){var p=document.createElement("p");p.className=who==="visitor"?"chat-user-message":"chat-assistant-message";p.textContent=value;log.appendChild(p);log.scrollTop=log.scrollHeight;}'+
   'function reply(q){msg(q,"visitor");var clean=q.toLowerCase().replace(/[^a-z0-9 ]/g," ").trim();var words=clean.split(/\\s+/).filter(function(w){return w.length>3});var ranked=entries.map(function(e){var title=e.question.toLowerCase();var score=words.filter(function(w){return title.includes(w)}).length;return {e:e,score:score}}).sort(function(a,b){return b.score-a.score});msg(ranked.length&&ranked[0].score>0?ranked[0].e.answer:"I don’t have a confirmed answer to that question. Please use the enquiry form to ask the instructor.");}'+
   'function open(){if(!d.open)d.showModal();if(!log.children.length)msg('+JSON.stringify(c.assistant.welcomeMessage||"Hello! Ask me about lessons, teaching areas or how to enquire.").replace(/</g,"\\u003c")+');input.focus();}'+
   'document.querySelectorAll("[data-open-chat]").forEach(function(b){b.addEventListener("click",open)});'+
   'var close=document.getElementById("chat-close");if(close)close.addEventListener("click",function(){d.close()});'+
   'form.addEventListener("submit",function(e){e.preventDefault();var q=input.value.trim();if(!q)return;input.value="";reply(q)});'+
   'entries.slice(0,4).forEach(function(e){var b=document.createElement("button");b.type="button";b.textContent=e.question;b.addEventListener("click",function(){reply(e.question)});suggest.appendChild(b)});'+
   '})();';
  page=page.slice(0,chatStart)+'<script>'+script+'</script>'+page.slice(chatEnd+9);
 }

 }
 page=applySharedWebsitePolish(page);
 replace('</head>','<style>#yotion-demo-enquiry :is(input,select,textarea){font-size:16px}</style><meta name="robots" content="noindex,nofollow">'+(options.published?'<meta name="yotion-demo-ready" content="true">':'')+'</head>');

 return page;
}
