import { escapeOrderHtml as escapeHtml } from "./yotion-order-progress";

type AdminSection = "orders" | "demos";

const navigation = [
  { section: "orders", label: "Paid orders", href: "/admin/orders",
    icon: '<path d="M5 7h14v13H5zM8 4h8v3M8 11h8m-8 4h6"/>' },
  { section: "demos", label: "Demo requests", href: "/admin/demo-requests",
    icon: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9h16m-12 4h3m-3 3h6"/>' },
] as const;

const shellStyles = `
  :root{--yotion-ink:#172e2b;--yotion-green:#175e4c;--yotion-muted:#465d51;--yotion-line:#dce6dd;--yotion-paper:#f6f8f3}
  *{box-sizing:border-box}
  body.yotion-admin{margin:0;background:var(--yotion-paper);color:var(--yotion-ink);font:400 16px/1.55 Arial,sans-serif}
  .yotion-admin :focus-visible{outline:3px solid #37836d;outline-offset:3px}
  .yotion-admin .admin-skip{position:absolute;top:-8rem;left:1rem;z-index:10;background:white;color:var(--yotion-green);padding:.55rem .9rem}
  .yotion-admin .admin-skip:focus{top:1rem}
  .admin-shell{display:grid;grid-template-columns:14rem minmax(0,1fr);min-height:100vh}
  .admin-shell .admin-sidebar{background:#203a34;color:#f4f8f1;padding:1.35rem 1rem;display:flex;flex-direction:column;gap:1.55rem}
  .admin-sidebar .admin-brand,.admin-access .admin-brand{display:inline-flex;align-items:center;gap:.65rem;color:inherit;text-decoration:none;font:700 1.23rem/1.25 Arial,sans-serif}
  .admin-sidebar .admin-brand{padding:.15rem .55rem}
  .admin-brand img{display:block;flex:none;width:36px;height:36px;background:white;border-radius:8px;padding:5px}
  .admin-brand small{display:block;margin-top:.12rem;font:400 .82rem/1.25 Arial,sans-serif;color:#d3e4d9}
  .admin-sidebar .admin-primary-nav{display:grid;gap:.3rem;margin:0}
  .admin-sidebar .admin-primary-nav a{display:flex;align-items:center;gap:.65rem;min-height:44px;padding:.55rem .7rem;color:inherit;background:transparent;border:1px solid transparent;text-decoration:none;border-radius:6px;font:400 .94rem/1.35 Arial,sans-serif}
  .admin-primary-nav svg{width:19px;height:19px;flex:none}
  .admin-sidebar .admin-primary-nav a[aria-current]{color:#172e2b;background:#cfe77a;font-weight:700}
  .admin-sidebar .admin-primary-nav a:hover:not([aria-current]){background:#2c4840}
  .admin-sidebar :focus-visible{outline-color:#cfe77a}
  .admin-sidebar .admin-sign-out{margin:auto 0 0}
  .admin-sidebar .admin-sign-out button{width:auto;min-height:40px;margin:0;padding:.35rem .7rem;background:transparent;color:inherit;border:1px solid #afc5b8;border-radius:6px;font:400 .92rem Arial,sans-serif;cursor:pointer}
  .admin-shell .admin-content{width:100%;min-width:0;max-width:88rem;margin:0 auto;padding:clamp(1.1rem,4vw,3rem)}
  .admin-content :is(h1,h2,h3){font-family:Arial,sans-serif;font-weight:500}
  .admin-content h1{font-size:clamp(2rem,5vw,3rem);line-height:1.12;letter-spacing:-.04em;overflow-wrap:anywhere}
  .admin-content .admin-heading{margin:0 0 .4rem}
  .admin-content .admin-trail{margin:0 0 .8rem;color:var(--yotion-muted);font-size:.9rem}
  .admin-content .admin-trail a{color:var(--yotion-green)}
  .admin-access{width:min(100% - 2rem,28rem);margin:clamp(2rem,10vh,6rem) auto}
  .admin-access .admin-brand small{color:var(--yotion-muted)}
  .admin-access .admin-access-card{margin-top:1.25rem;background:white;border:1px solid var(--yotion-line);border-radius:12px;padding:clamp(1.1rem,5vw,2rem)}
  @media(max-width:860px){.admin-shell{grid-template-columns:11.5rem minmax(0,1fr)}}
  @media(max-width:650px){.admin-shell{display:block}.admin-shell .admin-sidebar{padding:.75rem 1rem;gap:.65rem}.admin-sidebar .admin-primary-nav{display:flex;flex-wrap:wrap}.admin-sidebar .admin-sign-out{margin:0}.admin-shell .admin-content{padding:1.15rem 1rem 2rem}}
`;

export function adminShell(input: {
  title: string; section?: AdminSection; body: string; styles?: string; script?: string;
}) {
  const brand = '<a class="admin-brand" href="/admin"><img src="/yotion-icon.svg" width="36" height="36" alt=""><span>Yotion<small>Admin workspace</small></span></a>';
  const nav = navigation.map(item => `<a href="${item.href}"${item.section === input.section ? ' aria-current="page"' : ""}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${item.icon}</svg>${item.label}</a>`).join("");
  const content = input.section
    ? `<a class="admin-skip" href="#admin-main">Skip to content</a><div class="admin-shell">
      <aside class="admin-sidebar">${brand}<nav class="admin-primary-nav" aria-label="Admin navigation">${nav}</nav>
      <form class="admin-sign-out" method="post" action="/admin/logout"><button type="submit">Sign out</button></form></aside>
      <main class="admin-content" id="admin-main">${input.body}</main></div>`
    : `<main class="admin-access">${brand}<section class="admin-access-card">${input.body}</section></main>`;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
  <title>${escapeHtml(input.title)} | Yotion Admin</title><link rel="icon" type="image/svg+xml" href="/yotion-icon.svg">
  <style>${input.styles ?? ""}\n${shellStyles}</style></head><body class="yotion-admin">${content}${input.script ? `<script>${input.script}</script>` : ""}</body></html>`;
}
