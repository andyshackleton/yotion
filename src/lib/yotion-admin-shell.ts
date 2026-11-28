import { escapeOrderHtml as escapeHtml } from "./yotion-order-progress";

type AdminSection = "orders" | "demos";

const navigation = [
  { section: "orders", label: "Paid orders", href: "/admin/orders",
    icon: '<path d="M5 7h14v13H5zM8 4h8v3M8 11h8m-8 4h6"/>' },
  { section: "demos", label: "Demo requests", href: "/admin/demo-requests",
    icon: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16m-12 4h3m-3 3h6"/>' },
] as const;

const shellStyles = `
  :root{
    --yotion-ink:#172e2b;--yotion-green:#175e4c;--yotion-deep:#203a34;--yotion-accent:#cfe77a;
    --yotion-muted:#52665b;--yotion-line:#dce6dd;--yotion-paper:#f6f8f3;--yotion-surface:#fff;
    --yotion-radius:12px;--yotion-shadow:0 1px 2px #172e2b0c,0 3px 10px #172e2b08
  }
  *{box-sizing:border-box}
  body.yotion-admin{margin:0;background:var(--yotion-paper);color:var(--yotion-ink);font:400 15px/1.55 Arial,sans-serif}
  .yotion-admin :focus-visible{outline:3px solid #37836d;outline-offset:3px}
  .yotion-admin .admin-skip{position:absolute;top:-8rem;left:1rem;z-index:20;background:white;color:var(--yotion-green);padding:.55rem .9rem}
  .yotion-admin .admin-skip:focus{top:1rem}
  .admin-shell{display:grid;grid-template-columns:15rem minmax(0,1fr);min-height:100vh}
  .admin-shell .admin-sidebar{position:sticky;top:0;height:100dvh;overflow:auto;background:var(--yotion-deep);color:#f4f8f1;
    padding:1.4rem 1rem 1rem;display:flex;flex-direction:column;gap:1.35rem}
  .admin-sidebar .admin-brand,.admin-access .admin-brand{display:inline-flex;align-items:center;gap:.7rem;color:inherit;text-decoration:none;font:700 1.25rem/1.2 Arial,sans-serif;letter-spacing:-.025em}
  .admin-sidebar .admin-brand{padding:.1rem .55rem 1.25rem;border-bottom:1px solid #ffffff24}
  .admin-brand img{display:block;flex:none;width:36px;height:36px;background:white;border-radius:9px;padding:5px}
  .admin-brand small{display:block;margin-top:.18rem;font:400 .8rem/1.3 Arial,sans-serif;letter-spacing:0;color:#d3e4d9}
  .admin-sidebar .admin-primary-nav{display:grid;gap:.28rem;margin:0}
  .admin-sidebar .admin-primary-nav a{display:flex;align-items:center;gap:.65rem;min-height:42px;padding:.55rem .7rem;
    color:#e6f0e8;background:transparent;border:1px solid transparent;text-decoration:none;border-radius:7px;font:400 .92rem/1.35 Arial,sans-serif}
  .admin-primary-nav svg{width:18px;height:18px;flex:none}
  .admin-sidebar .admin-primary-nav a[aria-current]{color:#172e2b;background:var(--yotion-accent);font-weight:700}
  .admin-sidebar .admin-primary-nav a:hover:not([aria-current]){background:#2c4840}
  .admin-sidebar :focus-visible{outline-color:var(--yotion-accent)}
  .admin-sidebar .admin-sign-out{margin:auto 0 0;padding-top:.8rem;border-top:1px solid #ffffff24}
  .admin-sidebar .admin-sign-out button{width:auto;min-height:38px;margin:0;padding:.35rem .65rem;background:transparent;color:#e6f0e8;border:0;border-radius:6px;font:400 .9rem Arial,sans-serif;cursor:pointer}
  .admin-sidebar .admin-sign-out button:hover{background:#2c4840}
  .admin-frame{min-width:0}
  .admin-topbar{display:flex;align-items:center;gap:.55rem;min-height:56px;background:white;border-bottom:1px solid var(--yotion-line);
    padding:.65rem clamp(1.2rem,4vw,3rem);font-size:.85rem;color:var(--yotion-muted)}
  .admin-topbar a{color:var(--yotion-muted);text-decoration:none}.admin-topbar a:hover{text-decoration:underline}
  .admin-topbar strong{font-weight:700;color:var(--yotion-ink)}
  .admin-shell .admin-content{width:100%;min-width:0;max-width:84rem;margin:0 auto;padding:clamp(1.2rem,4vw,3rem)}
  .admin-content :is(h1,h2,h3){font-family:Arial,sans-serif;font-weight:500;color:inherit}
  .admin-content h1{font-size:clamp(1.9rem,4vw,2.65rem);line-height:1.12;letter-spacing:-.045em;overflow-wrap:anywhere}
  .admin-content .admin-heading{margin:0 0 .45rem}
  .admin-content :is(.panel,.pane,.card,.publish-panel,.workspace-card){border:1px solid var(--yotion-line);border-radius:var(--yotion-radius);box-shadow:var(--yotion-shadow)}
  .admin-content :is(.panel,.pane,.card,.publish-panel)>h2{letter-spacing:-.022em}
  .admin-content :is(input:not([type=checkbox]):not([type=radio]):not([type=hidden]),select,textarea){
    font:400 15px/1.45 Arial,sans-serif;color:var(--yotion-ink);border:1px solid #9fb3a7;border-radius:7px;background:white
  }
  .admin-content :is(input,select,textarea):focus{border-color:var(--yotion-green)}
  .admin-content :is(.button,button.primary){font:400 15px/1.35 Arial,sans-serif;min-height:38px;border-radius:7px;align-content:center}
  .admin-content .tabs{gap:.4rem;margin:1.35rem 0 1.5rem}
  .admin-content .tabs a{padding:.67rem .9rem;font-size:.93rem;border-radius:6px 6px 0 0}
  .admin-content .tabs a[aria-current]{background:#eaf2e8}
  .admin-access{width:min(100% - 2rem,28rem);margin:clamp(2rem,10vh,6rem) auto}
  .admin-access .admin-brand small{color:var(--yotion-muted)}
  .admin-access .admin-access-card{margin-top:1.25rem;background:white;border:1px solid var(--yotion-line);border-radius:var(--yotion-radius);box-shadow:var(--yotion-shadow);padding:clamp(1.1rem,5vw,2rem)}
  @media(max-width:860px){.admin-shell{grid-template-columns:12rem minmax(0,1fr)}}
  @media(max-width:650px){
    .admin-shell{display:block}.admin-shell .admin-sidebar{position:static;height:auto;overflow:visible;padding:.8rem 1rem;gap:.6rem}
    .admin-sidebar .admin-brand{padding:0;border:0}.admin-sidebar .admin-primary-nav{display:flex;flex-wrap:wrap}
    .admin-sidebar .admin-sign-out{margin:0;padding:0;border:0}
    .admin-topbar{min-height:42px;padding-inline:1rem}.admin-shell .admin-content{padding:1.15rem 1rem 2rem}
  }
`;

export function adminShell(input: {
  title: string; section?: AdminSection; body: string; styles?: string; script?: string;
}) {
  const brand = '<a class="admin-brand" href="/admin"><img src="/yotion-icon.svg" width="36" height="36" alt=""><span>Yotion<small>Admin workspace</small></span></a>';
  const nav = navigation.map(item => `<a href="${item.href}"${item.section === input.section ? ' aria-current="page"' : ""}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${item.icon}</svg>${item.label}</a>`).join("");
  const area = navigation.find(item => item.section === input.section);
  const content = input.section
    ? `<a class="admin-skip" href="#admin-main">Skip to content</a><div class="admin-shell">
      <aside class="admin-sidebar">${brand}<nav class="admin-primary-nav" aria-label="Admin navigation">${nav}</nav>
      <form class="admin-sign-out" method="post" action="/admin/logout"><button type="submit">Sign out</button></form></aside>
      <div class="admin-frame"><div class="admin-topbar"><a href="/admin">Admin</a><span aria-hidden="true">/</span>
      <strong>${area?.label ?? ""}</strong></div><main class="admin-content" id="admin-main">${input.body}</main></div></div>`
    : `<main class="admin-access">${brand}<section class="admin-access-card">${input.body}</section></main>`;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
  <title>${escapeHtml(input.title)} | Yotion Admin</title><link rel="icon" type="image/svg+xml" href="/yotion-icon.svg">
  <style>${input.styles ?? ""}\n${shellStyles}</style></head><body class="yotion-admin">${content}${input.script ? `<script>${input.script}</script>` : ""}</body></html>`;
}
