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
 const accent=colours[c.branding.colour]||colours.green;
 replace('</head>','<style>:root{--palette-087f78:'+accent+';--teal:'+accent+'} .yotion-draft-banner{position:relative;z-index:100;background:#152b36;color:white;text-align:center;padding:10px;font:600 13px system-ui}</style><meta name="robots" content="noindex,nofollow">'+(options.published?'<meta name="yotion-demo-ready" content="true">':'')+'</head>');
 return page;
}
