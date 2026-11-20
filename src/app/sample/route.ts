import {applySharedWebsitePolish} from "../../lib/yotion-shared-website-polish";
import {greenlightOriginalHtml as html} from "../../lib/yotion-greenlight-original";
// Preserved original Greenlight Driving example template (including theme picker).
// This is a standalone preview until the tenant template is componentised.
export const dynamic = "force-dynamic";
import {NextRequest} from "next/server";
const icons={
desktop:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>',
tablet:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 19h2"/></svg>',
phone:'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/></svg>'
};
const toolbar='<div class="theme-demo-bar"><span class="theme-demo-copy">Demonstration school · Illustrative prices and learner stories</span><div class="device-tools" role="group" aria-label="Preview screen size"><button type="button" data-device="desktop" aria-pressed="true" title="Desktop view" aria-label="Desktop view">'+icons.desktop+'</button><button type="button" data-device="tablet" aria-pressed="false" title="iPad view" aria-label="iPad view">'+icons.tablet+'</button><button type="button" data-device="phone" aria-pressed="false" title="Mobile view" aria-label="Mobile view">'+icons.phone+'</button></div><div class="theme-tools"><label for="theme-picker">Try your colours</label><select id="theme-picker" aria-label="Website colour theme"><option value="green">Green</option><option value="blue">Blue</option><option value="purple">Purple</option><option value="charcoal">Charcoal</option><option value="emerald">Emerald</option><option value="red">Red</option><option value="orange">Orange</option><option value="amber">Amber / gold</option><option value="pink">Pink</option><option value="burgundy">Burgundy</option><option value="navy">Navy</option></select></div></div>';
const wrapper='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Greenlight Driving · Yotion live example</title><style>*{box-sizing:border-box}body{margin:0;background:#edf2ed;color:#172e2b;font:14px/1.5 Arial,sans-serif}.yotion-example-cta{display:flex;justify-content:center;align-items:center;gap:15px;flex-wrap:wrap;background:#172e2b;color:#fff;padding:11px 18px}.yotion-example-cta strong{color:#cfe77a}.yotion-example-cta a{color:#172e2b;background:#cfe77a;text-decoration:none;border-radius:22px;padding:8px 14px;font-weight:700}.theme-demo-bar{display:flex;align-items:center;justify-content:center;gap:clamp(12px,2vw,30px);flex-wrap:wrap;background:#fff;padding:13px 20px;border-bottom:1px solid #dbe5da}.theme-demo-copy{font-size:13px;color:#516a5c}.theme-tools,.device-tools{display:flex;align-items:center;gap:7px}.theme-tools label{font-weight:700;white-space:nowrap}.theme-tools select{padding:9px;border:1px solid #cbd9c9;border-radius:8px;background:#fff;color:#172e2b}.device-tools{background:#eff4ed;padding:4px;border-radius:10px}.device-tools button{display:inline-flex;align-items:center;justify-content:center;width:40px;height:36px;border:0;border-radius:7px;background:transparent;color:#4b6759;cursor:pointer}.device-tools button[aria-pressed=true]{background:#175e4c;color:white;box-shadow:0 2px 8px #173b2126}.device-tools button:hover:not([aria-pressed=true]){background:#dce9d9}.device-tools button:focus-visible,.theme-tools select:focus-visible{outline:3px solid #79a45e;outline-offset:2px}.viewport{display:flex;justify-content:center;padding:0;overflow-x:auto}.frame{width:100%;max-width:100%;height:calc(100dvh - 120px);min-height:540px;background:#fff;border:0;box-shadow:none;transition:width .35s ease,max-width .35s ease,border-radius .35s}.frame.tablet{width:768px;max-width:100%;border:8px solid #263d37;border-radius:17px;margin:18px auto;box-shadow:0 14px 44px #1b39271c}.frame.phone{width:390px;max-width:100%;border:7px solid #263d37;border-radius:20px;margin:18px auto;box-shadow:0 14px 44px #1b39271c}iframe{display:block;width:100%;height:100%;border:0;background:#fff}@media(max-width:600px){.theme-demo-bar{gap:9px;padding:12px}.theme-demo-copy{width:100%;text-align:center}.viewport{padding:10px 4px}.frame{min-height:600px}}@media(prefers-reduced-motion:reduce){.frame{transition:none}}</style></head><body><aside class="yotion-example-cta"><span><strong>Example website ·</strong> See how Yotion could personalise this for your driving school.</span><a href="/">Back to Yotion</a></aside>'+toolbar+'<main class="viewport"><div id="frame" class="frame"><iframe id="sample-frame" src="/sample?embedded=1" title="Greenlight Driving interactive website demonstration"></iframe></div></main><script>(function(){var frame=document.getElementById("frame"),view=document.getElementById("sample-frame"),picker=document.getElementById("theme-picker");function sendTheme(){view.contentWindow.postMessage({type:"yotion-demo-theme",theme:picker.value},location.origin)}document.querySelectorAll("[data-device]").forEach(function(button){button.addEventListener("click",function(){frame.className="frame "+(button.dataset.device==="desktop"?"":button.dataset.device);document.querySelectorAll("[data-device]").forEach(function(b){b.setAttribute("aria-pressed",String(b===button));});});});picker.addEventListener("change",sendTheme);view.addEventListener("load",function(){try{var inner=view.contentWindow.document.getElementById("theme-picker");if(inner){picker.value=inner.value;}}catch(e){}});})();</script></body></html>';
const showcaseStyles = `<style>
.sample-return{font-size:13px;font-weight:700;color:var(--teal);text-underline-offset:4px}
.sample-device-link{font-size:12px;color:var(--teal);text-underline-offset:4px}
#areas-covered,#lessons,#instructor,#questions,#enquire{scroll-margin-top:100px}
.sample-menu-toggle{display:none}
.btn,.nav nav .nav-cta,.chat-launcher,.sample-chat-button{
 transition:background-color 230ms ease,color 230ms ease,border-color 230ms ease;
}
.btn:is(:hover,:focus-visible),.nav nav .nav-cta:is(:hover,:focus-visible){transform:none;box-shadow:none}
.btn:not(.secondary):is(:hover,:focus-visible),.nav nav .nav-cta:is(:hover,:focus-visible),
.chat-launcher:is(:hover,:focus-visible),.sample-chat-button:is(:hover,:focus-visible){
 background-color:var(--palette-05675f,#05675f);color:white;
}
.btn .cta-arrow,.nav-cta .cta-arrow{display:inline-block;width:1.25em;animation:none!important;transition:transform 230ms ease}
.btn:is(:hover,:focus-visible) .cta-arrow,.nav-cta:is(:hover,:focus-visible) .cta-arrow{transform:translateX(4px)}
.sample-chat-button,.chat-launcher{
 display:inline-flex;align-items:center;gap:10px;border:1px solid #fff4;background:var(--teal);color:white;
 border-radius:35px;padding:12px 17px;font:700 14px 'DM Sans',sans-serif;cursor:pointer;
}
.sample-chat-button svg,.chat-launcher svg{width:18px;height:18px;stroke:currentColor;stroke-width:1.7;fill:none}
.site-footer .sample-chat-button{margin-top:8px}
@media(max-width:950px){
 .nav{position:relative}
 .sample-menu-toggle{display:inline-flex;align-items:center;min-height:44px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:white;color:var(--navy);font:inherit;cursor:pointer}
 .nav nav#sample-school-nav{display:none!important;position:absolute;top:100%;left:12px;right:12px;z-index:40;padding:12px;background:white;border:1px solid var(--line);border-radius:12px;flex-direction:column;align-items:stretch}
 .nav nav#sample-school-nav.is-open{display:flex!important}
 .nav nav#sample-school-nav a{display:flex!important;min-height:44px;align-items:center}
}
@media(prefers-reduced-motion:reduce){
 .btn,.nav nav .nav-cta,.chat-launcher,.sample-chat-button,.btn .cta-arrow,.nav-cta .cta-arrow{transition:none!important}
 .btn .cta-arrow,.nav-cta .cta-arrow{transform:none!important}
}
</style>`;

const schoolNavigation = '<button type="button" class="sample-menu-toggle" aria-expanded="false" aria-controls="sample-school-nav">Menu</button>'
 + '<nav id="sample-school-nav" aria-label="Driving school"><a class="nav-pill" href="#lessons">Lessons &amp; prices</a>'
 + '<a class="nav-pill" href="#areas-covered">Areas covered</a><a class="nav-pill" href="#instructor">Meet your instructor</a>'
 + '<a class="nav-pill" href="#questions">FAQs</a><a class="nav-cta" href="#enquire">Contact Us</a></nav>';

const menuScript = `<script>
(() => {
 const nav=document.getElementById("sample-school-nav");
 const toggle=document.querySelector(".sample-menu-toggle");
 const setOpen=open=>{nav.classList.toggle("is-open",open);toggle.setAttribute("aria-expanded",String(open));};
 toggle.addEventListener("click",()=>setOpen(toggle.getAttribute("aria-expanded")!=="true"));
 nav.addEventListener("click",event=>{if(event.target.closest("a"))setOpen(false);});
 document.addEventListener("keydown",event=>{if(event.key==="Escape"&&toggle.getAttribute("aria-expanded")==="true"){setOpen(false);toggle.focus();}});
})();
</script>`;

function renderStandaloneSample() {
 const sample = applySharedWebsitePolish(html).replaceAll("Greenlight","Greenlane");
 const chatIcon = sample.match(/id="chat-launcher"[^>]*>(<svg[\s\S]*?<\/svg>)/)?.[1] ?? "";
 const chatButton = '<button type="button" class="sample-chat-button" data-open-chat aria-haspopup="dialog" aria-controls="chat-dialog">'
  + chatIcon + '<span>Ask Greenlane</span></button>';
 return sample
  .replace(/<aside class="yotion-example-cta"[^>]*>[\s\S]*?<\/aside>/,"")
  .replace('<div class="theme-demo-bar">','<div class="theme-demo-bar"><a class="sample-return" href="https://yotion.co.uk/">Back to Yotion</a><a class="sample-device-link" href="https://yotion.co.uk/preview">Device preview</a>')
  .replace(/(<header>[\s\S]*?)<nav>[\s\S]*?<\/nav>/, (_, header) => header + schoolNavigation)
  .replace('<article class="outcome"><h3>Where we teach','<article class="outcome" id="areas-covered"><h3>Where we teach')
  .replace('<a class="btn" href="index.html">Return to Greenlane →</a>','<a class="btn" href="#home">Return to Greenlane →</a>')
  .replace("For a quick answer, <button class=\"inline-chat\" data-open-chat>ask our website assistant</button>.", "You can also ask our website assistant.")
  .replace(/<button class="(?:hero-chat-link|footer-chat)"[^>]*>[\s\S]*?<\/button>/g, () => chatButton)
  .replace(/(<(?:a|button)\b[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>[^<>]*?) →(?=<\/(?:a|button)>)/g,'$1 <span class="cta-arrow" aria-hidden="true">→</span>')
  .replace("</head>",showcaseStyles+"</head>")
  .replace("</body>",menuScript+"</body>");
}

export function GET(request:NextRequest) {
 const host=(request.headers.get("host")||"").split(":")[0].toLowerCase();
 if(host==="sample.yotion.co.uk"){
  // The showcase subdomain is a standalone example, not the Yotion preview frame.
  const standalone=renderStandaloneSample();
  return new Response(standalone,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-store"}});
 }
 const embedded=new URL(request.url).searchParams.get("embedded")==="1";
 const page=embedded?html.slice(0,html.indexOf("<aside class=")).replace("</head>","<style>header,.nav,body>header{position:static!important;top:auto!important}</style></head>")+html.slice(html.indexOf("<header>")):wrapper;
 return new Response(page,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","X-Robots-Tag":"noindex, nofollow","Cache-Control":"no-store"}});
}
