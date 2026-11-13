import type {WebsiteConfig} from "./yotion-website-config";
import {greenlightOriginalHtml} from "./yotion-greenlight-original";
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]??c));
const colours:Record<string,string>={green:"#087f78",blue:"#1459a2",purple:"#75449c",charcoal:"#3b4654",emerald:"#187043",red:"#b82e38",orange:"#b8480e",amber:"#926000",pink:"#ad286c",burgundy:"#842b4a",navy:"#193b66"};
/** Preserve the entire original Greenlight design, media and interactions.
 * Personalisation is deliberately narrow until every section has a tested mapping. */
export function renderDrivingSchoolWebsite(c:WebsiteConfig,options:{published:boolean}):string{
 const brand=esc(c.branding.schoolName);
 let page=greenlightOriginalHtml;
 // Customer demonstrations must not contain Yotion's sample-only marketing controls.
 page=page.replace(/<aside class="yotion-example-cta"[^>]*>[\s\S]*?<\/aside>/,"");
 page=page.replace(/<div class="theme-demo-bar">[\s\S]*?<\/select><\/div><\/div>/,"");
 page=page.replace(/<section class="section" id="greenlight-privacy">[\s\S]*?<\/section>/,"");
 page=page.replace(/<a[^>]*href="#greenlight-privacy"[^>]*>[\s\S]*?<\/a>/g,"");

 const replace=(from:string,to:string)=>{page=page.replace(from,to)};
 replace("<title>Greenlight Driving | Automatic driving lessons in Liverpool</title>","<title>"+brand+" | Driving lessons</title>");
 replace('content="Friendly automatic driving lessons in Liverpool. Explore prices, areas and patient tuition, or ask the Greenlight assistant a quick question."','content="'+esc(c.hero.description)+'"');
 replace('Your road to<br><em>feeling confident.</em>',esc(c.hero.headline));
 replace('A calm start. A clear plan. Lessons that move at your pace.',esc(c.hero.description));
 replace('AUTOMATIC DRIVING LESSONS IN LIVERPOOL',esc(c.hero.eyebrow));
 replace('Ask about your first lesson →',esc(c.hero.primaryCtaLabel));
 // Update prominent branding without replacing embedded scripts, data URLs or CSS.
 replace('Greenlight <span>Driving</span>',brand);
 replace('<strong>Greenlight Driving</strong>','<strong>'+brand+'</strong>');

 // Replace sample-only claims and content with the instructor's confirmed configuration.
 const replaceSection=(start:string,end:string,markup:string)=>{
  const a=page.indexOf(start),b=a<0?-1:page.indexOf(end,a+start.length);
  if(a>=0&&b>a)page=page.slice(0,a)+markup+page.slice(b);
 };
 const wrap=(id:string,heading:string,body:string,soft=false)=>
  '<section class="section'+(soft?' soft':'')+'" id="'+id+'"><div class="wrap"><h2>'+esc(heading)+'</h2>'+body+'</div></section>';
 const lessonCards=c.lessons.items.map(x=>'<article class="outcome"><h3>'+esc(x.title)+'</h3>'+(x.price?'<div class="sample-price">'+esc(x.price)+'</div>':'')+'<p class="sample-info">'+esc(x.description)+'</p></article>').join("");
 replaceSection('<section class="section" id="lessons">','<section class="section soft" id="instructor">',
  wrap('lessons',c.lessons.heading,'<p>'+esc(c.lessons.intro)+'</p>'+(lessonCards?'<div class="outcome-grid">'+lessonCards+'</div>':'')));
 const instructorBody='<p class="lead">'+esc(c.instructor.biography)+'</p>';
 replaceSection('<section class="section soft" id="instructor">','<section class="section learner-stories" id="stories"',
  wrap('instructor',c.instructor.heading,instructorBody+'<h3>'+esc(c.teachingAreas.heading)+'</h3>'+(c.teachingAreas.areas.length?'<p>'+c.teachingAreas.areas.map(esc).join(' · ')+'</p>':''),true));
 const reviewCards=c.reviews.items.map(x=>'<article class="story-card"><blockquote>'+esc(x.quote)+'</blockquote><p>'+esc(x.attribution)+'</p></article>').join("");
 replaceSection('<section class="section learner-stories" id="stories"','<section class="section" id="questions">',
  c.reviews.items.length?wrap('stories',c.reviews.heading,'<div class="stories-grid">'+reviewCards+'</div>'):'');
 const faqItems=c.faq.items.map(x=>'<details><summary>'+esc(x.question)+'</summary><p>'+esc(x.answer)+'</p></details>').join("");
 replaceSection('<section class="section" id="questions">','<section class="section soft" id="enquire">',
  c.faq.items.length?wrap('questions',c.faq.heading,faqItems):'');
 // Keep the original enquiry form layout, but never send or store test details.
 // The browser explicitly confirms what would happen after production activation.
 const form='<form class="form-card" id="yotion-demo-enquiry">'+
  '<h3>Tell us what would work.</h3><p class="fine">Demonstration only — no details are sent or saved.</p>'+
  '<label for="learner-name">Your name</label><input id="learner-name" name="name" required maxlength="120" autocomplete="name">'+
  '<label for="learner-email">Email address</label><input id="learner-email" name="email" type="email" required maxlength="254" autocomplete="email">'+
  '<label for="learner-area">Your area / postcode</label><input id="learner-area" name="area" required maxlength="100">'+
  '<label for="learner-experience">Driving experience</label><select id="learner-experience" name="experience"><option>Complete beginner</option><option>Some lessons</option><option>Returning to driving</option></select>'+
  '<label for="learner-times">Preferred lesson times</label><textarea id="learner-times" name="availability" rows="3" maxlength="500"></textarea>'+
  '<label for="learner-notes">Anything else?</label><textarea id="learner-notes" name="notes" rows="3" maxlength="1000"></textarea>'+
  '<button class="btn full" type="submit">Send my enquiry</button>'+
  '<p id="yotion-enquiry-confirmation" role="status" aria-live="polite" hidden style="padding:14px;border-radius:10px;background:#e6f5ef;color:#152b36">In production, these details would be emailed securely to the driving instructor. This is a demonstration: nothing has been sent or stored.</p></form>';
 const enquiry='<div class="wrap form-layout"><div><div class="eyebrow">ONE SMALL NEXT STEP</div><h2>'+esc(c.contact.heading)+'</h2><p>'+esc(c.contact.description)+'</p></div>'+form+'</div>';
 replaceSection('<section class="section soft" id="enquire">','</main>',
  '<section class="section soft" id="enquire">'+enquiry+'</section>');
 const demoScript='<script>(function(){var f=document.getElementById("yotion-demo-enquiry");if(!f)return;f.addEventListener("submit",function(e){e.preventDefault();if(!f.reportValidity())return;var n=document.getElementById("yotion-enquiry-confirmation");n.hidden=false;n.scrollIntoView({behavior:"smooth",block:"nearest"});});})();</script>';
 replace('</body>',demoScript+'</body>');
 page=page.replace(/Fictional demonstration school · Liverpool/g,'');
 page=page.replace(/<p class="footer-demo">[\s\S]*?<\/p>/g,'');


 // Personalise the lettermark and all visible assistant branding.
 const initial=Array.from(c.branding.schoolName.trim())[0]?.toLocaleUpperCase("en-GB")||"D";
 page=page.replace(/(<span class="school-icon" aria-hidden="true">)[^<]*(<\/span>)/,'$1'+esc(initial)+'$2');
 page=page.replace(/(<span class="chat-avatar" aria-hidden="true">)[^<]*(<\/span>)/,'$1'+esc(initial)+'$2');
 page=page.replace(/Ask Greenlight/g,'Ask '+brand);
 // The original chatbot script contains Greenlight-specific prices, locations and
 // fictional answers. Replace it with a local FAQ assistant sourced only from config.
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
   'function open(){if(!d.open)d.showModal();if(!log.children.length)msg('+JSON.stringify(c.assistant.welcomeMessage||"Hello! Ask me about lessons, teaching areas or how to enquire.")+');input.focus();}'+
   'document.querySelectorAll("[data-open-chat]").forEach(function(b){b.addEventListener("click",open)});'+
   'var close=document.getElementById("chat-close");if(close)close.addEventListener("click",function(){d.close()});'+
   'form.addEventListener("submit",function(e){e.preventDefault();var q=input.value.trim();if(!q)return;input.value="";reply(q)});'+
   'entries.slice(0,4).forEach(function(e){var b=document.createElement("button");b.type="button";b.textContent=e.question;b.addEventListener("click",function(){reply(e.question)});suggest.appendChild(b)});'+
   '})();';
  page=page.slice(0,chatStart)+'<script>'+script+'</script>'+page.slice(chatEnd+9);
 }

 const accent=colours[c.branding.colour]||colours.green;
 replace('</head>','<style>:root{--palette-087f78:'+accent+';--teal:'+accent+'} .yotion-draft-banner{position:relative;z-index:100;background:#152b36;color:white;text-align:center;padding:10px;font:600 13px system-ui}</style><meta name="robots" content="noindex,nofollow">'+(options.published?'<meta name="yotion-demo-ready" content="true">':'')+'</head>');
 return page;
}
