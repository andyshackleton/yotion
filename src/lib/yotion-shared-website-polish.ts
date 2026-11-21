/** Shared visual and interaction corrections for sample and customer websites. */
export const sharedWebsitePolish = `<style>
.site-footer .footer-bottom{margin-top:34px;padding-top:26px}
.btn .cta-arrow{display:inline-block;transition:transform .25s ease}
.btn:hover .cta-arrow{transform:translateX(5px)}
.btn,.nav-cta,.hero-chat-link{transition:background-color .25s ease,color .25s ease,transform .25s ease,box-shadow .25s ease}
.btn:is(:hover,:focus-visible,:active),.nav nav .nav-cta:is(:hover,:focus-visible,:active){transform:none;box-shadow:none}
.nav nav .nav-cta{background:var(--palette-167b70,#167b70)!important;color:#fff!important;border:1px solid transparent!important;box-shadow:none!important;transition:background-color 230ms ease,color 230ms ease}
.nav nav .nav-cta:is(:hover,:focus-visible){background:var(--palette-05675f,#05675f)!important;color:#fff!important;border-color:transparent!important;box-shadow:none!important}
.btn .cta-arrow{animation:none!important}
@media(prefers-reduced-motion:reduce){.btn .cta-arrow{transform:none!important}}
.chat-dialog[open]{position:fixed!important;top:auto!important;right:24px!important;bottom:24px!important;left:auto!important;margin:0!important;z-index:1000!important;height:min(580px,calc(100dvh - 48px))!important;max-height:calc(100dvh - 48px)!important;display:flex;flex-direction:column}
.chat-dialog[open] .chat-header{position:relative;z-index:2;flex-shrink:0}
.chat-dialog[open] .chat-log{min-height:0;overflow-y:auto}
body:has(.chat-dialog[open]) .chat-launcher{display:none!important}
@media(max-width:600px){.chat-dialog[open]{right:12px!important;bottom:12px!important;width:calc(100vw - 24px)!important;height:min(580px,calc(100dvh - 24px))!important;max-height:calc(100dvh - 24px)!important}}
@media(prefers-reduced-motion:reduce){.btn,.nav-cta,.hero-chat-link,.cta-arrow{transition:none!important}}
</style>`;
export function applySharedWebsitePolish(html:string):string{
 return html.replace("</head>",sharedWebsitePolish+"</head>");
}

export const schoolNavigationLinks = '<a class="nav-pill" href="#lessons">Lessons &amp; prices</a>'
 + '<a class="nav-pill" href="#instructor">Your instructor</a><a class="nav-pill" href="#stories">Learner stories</a>'
 + '<a class="nav-pill" href="#questions">FAQs</a><a class="nav-cta" href="#enquire">Contact Us</a>';
