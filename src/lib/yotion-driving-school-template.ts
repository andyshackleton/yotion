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
 // The original sample form only copies an enquiry and must not masquerade as a
 // functioning lead capture system. Use a genuine mailto action until delivery exists.
 const email=c.contact.email.trim();
 const contactLink=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ?'<a class="btn" href="mailto:'+encodeURIComponent(email)+'?subject=Driving%20lesson%20enquiry">Email the instructor</a>':'';
 replaceSection('<section class="section soft" id="enquire">','<section class="section" id="greenlight-privacy">',
  wrap('enquire',c.contact.heading,'<p>'+esc(c.contact.description)+'</p>'+contactLink,true));
 page=page.replace(/Fictional demonstration school · Liverpool/g,'');
 page=page.replace(/<p class="footer-demo">[\s\S]*?<\/p>/g,'');

 const accent=colours[c.branding.colour]||colours.green;
 replace('</head>','<style>:root{--palette-087f78:'+accent+';--teal:'+accent+'} .yotion-draft-banner{position:relative;z-index:100;background:#152b36;color:white;text-align:center;padding:10px;font:600 13px system-ui}</style><meta name="robots" content="noindex,nofollow">'+(options.published?'<meta name="yotion-demo-ready" content="true">':'')+'</head>');
 return page;
}
