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
 const colouredHeadline=c.hero.headlineAccent?.trim();
 const fallbackWords=c.hero.headline.trim().split(/\s+/);
 const splitAt=Math.max(1,Math.ceil(fallbackWords.length/2));
 const plainHeadline=colouredHeadline
  ? esc(c.hero.headline)+'<br><em>'+esc(colouredHeadline)+'</em>'
  : heroParts?esc(heroParts[1])+'<br><em>'+esc(heroParts[2])+'</em>':fallbackWords.length>1?esc(fallbackWords.slice(0,splitAt).join(' '))+'<br><em>'+esc(fallbackWords.slice(splitAt).join(' '))+'</em>':esc(c.hero.headline);
 replace('Your road to<br><em>feeling confident.</em>',plainHeadline);
 replace('A calm start. A clear plan. Lessons that move at your pace.',esc(c.hero.description));
 replace('AUTOMATIC DRIVING LESSONS IN LIVERPOOL',esc(c.hero.eyebrow));
 replace('Ask about your first lesson →','Contact Us <span class="cta-arrow">→</span>');
 replace('Ask about lessons →','Contact Us');
 replace('Ask a quick question ','Ask');
 replace('</head>','<style>.nav nav .nav-chat{background:var(--teal);color:#fff;border:1px solid var(--teal);border-radius:9px;padding:11px 17px;font-weight:700;cursor:pointer;transition:background .2s ease,transform .2s ease}.nav nav .nav-chat:hover{filter:brightness(.92);transform:translateY(-1px)}.nav nav .nav-cta{background:transparent;color:var(--teal);border:1px solid var(--teal);border-radius:9px;padding:11px 17px;transition:background .2s ease,color .2s ease}.nav nav .nav-cta:hover{background:var(--mint)}</style></head>');
 // Update prominent branding without replacing embedded scripts, data URLs or CSS.
 const nameParts=c.branding.schoolName.trim().split(/\s+/);
 const colouredName=nameParts.length>1
  ? esc(nameParts.slice(0,-1).join(" "))+" <span>"+esc(nameParts[nameParts.length-1])+"</span>"
  : brand;
 replace('Greenlight <span>Driving</span>',colouredName);
 replace('<strong>Greenlight Driving</strong>','<strong>'+brand+'</strong>');
 replace('Meet Greenlight Driving<br><small>and Alex behind the wheel!</small>','Meet '+brand+'<br><small>and '+esc(c.instructor.name||'your instructor')+' behind the wheel!</small>');
 replace('© 2026 Greenlight Driving · Demonstration','© 2026 '+brand+' · Demonstration');
 page=page.replaceAll('>Meet Alex</a>','>About</a>');
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
 // One layout for every school. Only the content changes.
 updateSection("lessons","instructor",html=>{
  const cards=c.lessons.items.map(item=>'<article class="outcome"><h3>'+esc(item.title)+'</h3>'+(item.price?'<div class="sample-price">'+esc(item.price)+'</div>':'')+'<p class="sample-info">'+esc(item.description)+'</p></article>').join('');
  const areaCard=c.teachingAreas.areas.length?'<article class="outcome"><h3>'+esc(c.teachingAreas.heading)+'</h3><p class="sample-info">'+c.teachingAreas.areas.map(esc).join(' · ')+'</p></article>':'';
  return html.replace('Simple lessons. Clear prices.',esc(c.lessons.heading))
   .replace(/<div class="outcome-grid">[\s\S]*?<\/div><\/div><\/section>$/,
    '<div class="outcome-grid">'+cards+areaCard+'</div></div></section>');
 });
 updateSection("questions","enquire",html=>{
  const faqs=c.faq.items.map(item=>'<details><summary>'+esc(item.question)+'</summary><p>'+esc(item.answer)+'</p></details>').join('');
  return html.replace("It's okay to ask.",esc(c.faq.heading))
   .replace(/<details>[\s\S]*?<\/details>(?=\s*<\/div>\s*<\/section>)/,faqs);
 });
 updateSection("instructor","stories",html=>{
  // Keep the complete Sample layout, including its three-step journey.
  const heading=esc(c.instructor.name?'Hello, I\'m '+c.instructor.name+'.':c.instructor.heading);
  let result=html.replace("Hello, I'm Alex.",heading);
  result=result.replace(/<div class="instructor-copy">[\s\S]*?<\/div><\/div><\/div><div class="journey">/,
   '<div class="instructor-copy"><div class="eyebrow">MEET YOUR INSTRUCTOR</div><h2>'+heading+'</h2><p>'+esc(c.instructor.biography)+'</p></div></div></div><div class="journey">');
  if(c.instructor.photoUrl&&/^https:\/\//i.test(c.instructor.photoUrl)){
   result=result.replace(/(<figure class="instructor-portrait">[\s\S]*?<img src=")[^"]+("[^>]*>)/,
    (_,before,after)=>before+esc(c.instructor.photoUrl)+after);
  }else{
   result=result.replace(/<figure class="instructor-portrait">[\s\S]*?<\/figure>/,
    '<figure class="instructor-portrait"><div class="face-circle"><span class="instructor-placeholder" aria-label="Instructor photo pending">'+esc((c.instructor.name||c.branding.schoolName).charAt(0).toLowerCase())+'</span></div></figure>');
  }
  return result;
 });
 updateSection("stories","questions",html=>{
  if(!c.reviews.items.length)return '';
  const cards=c.reviews.items.map(item=>{
   const initials=item.attribution.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
   return '<article class="story-card"><blockquote>“'+esc(item.quote)+'”</blockquote><div class="story-person"><span class="story-initial" aria-hidden="true">'+esc(initials)+'</span><div><strong>'+esc(item.attribution)+'</strong></div></div></article>';
  }).join('');
  return html.replace('A little more confidence.<br>A lot more independence.',esc(c.reviews.heading))
   .replace(/<div class="stories-notice">[\s\S]*?<\/div>/,'')
   .replace(/<div class="stories-grid">[\s\S]*?<\/div><\/div><\/section>$/,
    '<div class="stories-grid">'+cards+'</div></div></section>');
 });
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
 // Shared chatbot implementation and shared visual classes for every website.
 const chatStart=page.indexOf('<script>',page.indexOf('id="chat-dialog"'));
 const chatEnd=chatStart<0?-1:page.indexOf('</script>',chatStart);
 if(chatStart>=0&&chatEnd>chatStart){
  const answers=[
   ...c.faq.items.map(x=>({question:x.question,answer:x.answer,href:'#questions'})),
   {question:"What lessons do you offer?",answer:c.lessons.items.map(x=>x.title+(x.price?' — '+x.price:'')+(x.description?'. '+x.description:'')).join(' ')||c.lessons.intro,href:'#lessons'},
   {question:"Where do you teach?",answer:c.teachingAreas.areas.join(', ')||"Please contact the instructor to confirm teaching areas.",href:'#lessons'},
   {question:"How do I enquire?",answer:"Use the contact form on this page. During this demonstration, it shows a confirmation rather than sending your details.",href:'#enquire'}
  ];
  const script='(function(){'+
   'var d=document.getElementById("chat-dialog"),log=document.getElementById("chat-log"),suggest=document.getElementById("chat-suggestions"),form=document.getElementById("chat-form"),input=document.getElementById("chat-message");'+
   'if(!d||!log||!suggest||!form||!input)return;'+
   'var entries='+JSON.stringify(answers).replace(/</g,"\\u003c")+';'+
   'function msg(value,who,href){var p=document.createElement("div");p.className="chat-message "+(who==="visitor"?"user":"bot");var t=document.createElement("p");t.textContent=value;p.appendChild(t);if(href){var actions=document.createElement("div");actions.className="chat-actions";var a=document.createElement("a");a.href=href;a.textContent="View on website →";a.addEventListener("click",function(){d.close()});actions.appendChild(a);p.appendChild(actions)}log.appendChild(p);log.scrollTop=log.scrollHeight;}'+
   'function reply(q){msg(q,"visitor");var clean=q.toLowerCase().trim().replace(/[’\u0027]/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\\s+/g," ").trim();'+
   'if(/^(hi|hello|hey|hiya|good morning|good afternoon|good evening)$/.test(clean)){msg("Hello! How can I help you today? You can ask about lessons, prices, teaching areas or getting started.","bot");return;}'+
   'if(/^(thanks|thank you|cheers|great|okay|ok|thank you very much)$/.test(clean)){msg("You’re welcome! Is there anything else you would like to know about learning to drive?","bot");return;}'+
   'if(/^(bye|goodbye|see you|see you later)$/.test(clean)){msg("Goodbye! If you have more questions, you can come back any time.","bot");return;}'+
   'var words=clean.split(/\\s+/).filter(function(w){return w.length>3});var ranked=entries.map(function(e){return {e:e,score:words.filter(function(w){return e.question.toLowerCase().includes(w)}).length}}).sort(function(a,b){return b.score-a.score});var hit=ranked.length&&ranked[0].score>0?ranked[0].e:null;msg(hit?hit.answer:"I don’t have a confirmed answer to that question. Please use the enquiry form to ask the instructor.","bot",hit?hit.href:"#enquire");}'+
   'function open(){if(!d.open)d.show();if(!log.children.length)msg('+JSON.stringify(c.assistant.welcomeMessage||"Hi, I’m the website assistant. Ask me about lessons, teaching areas or getting started.").replace(/</g,"\\u003c")+',"bot");if(!window.matchMedia("(max-width:600px)").matches)input.focus();}'+
   'document.querySelectorAll("[data-open-chat]").forEach(function(b){b.addEventListener("click",open)});'+
   'var close=document.getElementById("chat-close");if(close)close.addEventListener("click",function(){d.close()});'+
   'var reset=document.getElementById("chat-reset");if(reset)reset.addEventListener("click",function(){log.replaceChildren();suggest.replaceChildren();open()});'+
   'form.addEventListener("submit",function(e){e.preventDefault();var q=input.value.trim();if(!q)return;input.value="";reply(q)});'+
   'entries.slice(0,4).forEach(function(e){var b=document.createElement("button");b.type="button";b.textContent=e.question;b.addEventListener("click",function(){reply(e.question)});suggest.appendChild(b)});'+
   '})();';
  page=page.slice(0,chatStart)+'<script>'+script+'</script>'+page.slice(chatEnd+9);
 }
 // Apply button colours to the actual template classes, not a nonexistent nested nav.
 replace('</head>','<style>.nav nav .nav-chat{background:var(--accent,var(--teal,#087f78))!important;color:#fff!important;border-color:var(--accent,var(--teal,#087f78))!important}.nav nav .nav-cta{color:var(--accent,var(--teal,#087f78))!important;background:transparent!important;border:1px solid currentColor!important}.nav nav .nav-cta:hover{background:rgba(0,0,0,.05)!important}.sample-hero h1 em{color:var(--accent,var(--teal,#087f78))}</style></head>');
 // Customer sites use a real hamburger menu; the Sample remains untouched.
 replace('</nav></div></header>','</nav><button class="site-menu-toggle" type="button" aria-controls="customer-site-nav" aria-expanded="false" aria-label="Open menu"><span></span><span></span><span></span></button></div></header>');
 page=page.replace('<nav><a class="nav-pill"','<nav id="customer-site-nav"><a class="nav-pill"');
 replace('</head>','<style>.nav nav .nav-cta{background:var(--mint)!important;color:var(--teal)!important;border:0!important;font:700 12px "DM Sans",sans-serif!important;padding:11px 14px!important;border-radius:8px!important}.site-menu-toggle{display:none;border:1px solid var(--teal);border-radius:8px;background:#fff;padding:9px;cursor:pointer}.site-menu-toggle span{display:block;width:22px;height:2px;background:var(--teal);margin:4px}@media(max-width:950px){.site-menu-toggle{display:block;margin-left:auto}.nav .wrap{flex-wrap:wrap}.nav nav#customer-site-nav{display:none!important;width:100%;flex-direction:column;align-items:stretch;overflow:visible;white-space:normal;padding:12px 0}.nav nav#customer-site-nav.is-open{display:flex!important}.nav nav#customer-site-nav .nav-pill,.nav nav#customer-site-nav .nav-chat,.nav nav#customer-site-nav .nav-cta{display:flex!important;justify-content:center;width:100%}}</style></head>');
 replace('</body>','<script>(function(){var b=document.querySelector(".site-menu-toggle"),n=document.getElementById("customer-site-nav");if(!b||!n)return;b.addEventListener("click",function(){var open=n.classList.toggle("is-open");b.setAttribute("aria-expanded",String(open));b.setAttribute("aria-label",open?"Close menu":"Open menu")});n.querySelectorAll("a,button").forEach(function(link){link.addEventListener("click",function(){n.classList.remove("is-open");b.setAttribute("aria-expanded","false")})})})();</script></body>');
 replace('</head>','<style>.instructor-placeholder{display:grid;place-items:center;width:160px;height:220px;border-radius:75px 75px 13px 13px;background:var(--mint);color:var(--teal);font:700 80px Georgia,serif}.instructor-copy{min-width:0}</style></head>');
 // Dropdown is positioned over the page, never as a third header column.
 replace('</head>','<style>@media(max-width:950px){.nav{position:relative;z-index:1001}.nav>.wrap{position:relative!important;display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important}.nav nav#customer-site-nav{position:absolute!important;top:calc(100% + 8px)!important;right:0!important;left:auto!important;width:min(360px,calc(100vw - 36px))!important;max-height:calc(100dvh - 110px)!important;overflow-y:auto!important;background:#fff!important;border:1px solid var(--line)!important;border-radius:14px!important;padding:12px!important;box-shadow:0 16px 40px rgba(0,0,0,.14)!important;z-index:1002!important}.nav nav#customer-site-nav:not(.is-open){display:none!important}.site-menu-toggle{position:relative;z-index:1003;flex-shrink:0}.nav .school-brand{min-width:0}}</style></head>');
 page=applySharedWebsitePolish(page);
 replace('</head>','<style>#yotion-demo-enquiry :is(input,select,textarea){font-size:16px}</style><meta name="robots" content="noindex,nofollow">'+(options.published?'<meta name="yotion-demo-ready" content="true">':'')+'</head>');

 return page;
}
