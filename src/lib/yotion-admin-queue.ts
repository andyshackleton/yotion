import { escapeOrderHtml as esc } from "./yotion-order-progress";

export const queueStyles = `
.queue-header{display:flex;justify-content:space-between;align-items:start;gap:.75rem 1rem;margin-bottom:1.1rem;flex-wrap:wrap}
.queue-header p{margin:.2rem 0 0;color:var(--yotion-muted);max-width:42rem}
.queue-link{display:inline-flex;align-items:center;justify-content:center;min-height:38px;border:1px solid var(--yotion-line);border-radius:7px;padding:.35rem .7rem;background:white;color:var(--yotion-green);text-decoration:none;font:400 var(--yotion-control-size)/1.35 var(--yotion-font)}
.queue-link:hover{background:#edf3e9}
.queue-filters{display:flex;gap:.45rem;flex-wrap:wrap;margin:0 0 .75rem}
.queue-filter{display:inline-flex;align-items:center;gap:.45rem;min-height:36px;padding:.3rem .62rem;background:white;border:1px solid var(--yotion-line);
  border-radius:6px;color:var(--yotion-ink);text-decoration:none;font-size:.9rem}
.queue-filter:hover{border-color:#9bb6a7}
.queue-filter.selected{background:#ebf3e8;border-color:#739b86;color:var(--yotion-green);font-weight:700}
.queue-filter strong{font-size:.8rem;font-weight:700;font-variant-numeric:tabular-nums;padding:0 .25rem;color:#456253}
.queue-filter.attention strong{color:#855113}
.queue-panel{background:white;border:1px solid var(--yotion-line);border-radius:10px;overflow:hidden}
.queue-tools{padding:.7rem .9rem;display:flex;justify-content:space-between;align-items:center;gap:.65rem 1rem;flex-wrap:wrap;border-bottom:1px solid var(--yotion-line)}
.queue-tools form{display:flex;align-items:center;gap:.45rem;margin:0;flex:1 1 27rem;min-width:0}
.queue-search{position:relative;display:flex;align-items:center;flex:1;min-width:0}
.queue-search svg{position:absolute;left:.65rem;width:17px;height:17px;color:#557365;pointer-events:none}
.admin-content .queue-search input{width:100%;min-height:38px;padding:.38rem .65rem .38rem 2.05rem}
.queue-tools button{min-height:38px}
.queue-count{font-size:.85rem;color:var(--yotion-muted);margin:0;font-variant-numeric:tabular-nums}
.queue-empty{padding:clamp(1.15rem,4vw,2rem)}.queue-empty h2{font-size:1.2rem}.queue-empty p{margin:.4rem 0 0;color:var(--yotion-muted)}
.queue-notice{padding:.65rem .85rem;background:#edf3e9;border-left:3px solid var(--yotion-green);border-radius:4px}
.admin-content :is(.columns,.request-columns){background:#f8faf6;color:#345048;font-size:.82rem;letter-spacing:.01em;border-bottom:1px solid var(--yotion-line)}
.admin-content :is(.row,.request-grid):not(.request-columns){min-height:3.45rem}
.admin-content :is(.badge,.request-badge){padding:.14rem .44rem;border-radius:5px;font-size:.8rem}
.admin-content :is(.date,.received,.amount){font-variant-numeric:tabular-nums}
.admin-content .views{gap:1.1rem;margin-bottom:.75rem}.admin-content .views a{padding:.35rem .15rem .58rem}
`;

export function queueFilters(items: { label: string; value: number; href: string; selected?: boolean; attention?: boolean }[]) {
  return `<nav class="queue-filters" aria-label="Filter the work queue">${items.map(item =>
    `<a href="${esc(item.href)}" class="queue-filter${item.attention ? " attention" : ""}${item.selected ? " selected" : ""}"${item.selected ? ' aria-current="true"' : ""}>
      <span>${esc(item.label)}</span><strong>${item.value}</strong></a>`
  ).join("")}</nav>`;
}

export function queueSearch(label: string, value: string, placeholder: string) {
  return `<label class="queue-search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4 4"/></svg>
    <input name="q" type="search" aria-label="${esc(label)}" value="${esc(value)}" placeholder="${esc(placeholder)}" maxlength="100">
  </label>`;
}
