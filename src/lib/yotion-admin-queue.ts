import { escapeOrderHtml as esc } from "./yotion-order-progress";

export const queueStyles = `
.queue-header{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:1.6rem;flex-wrap:wrap}
.queue-header p{margin:.35rem 0 0;max-width:42rem;color:var(--yotion-muted)}
.queue-link{display:inline-flex;align-items:center;justify-content:center;min-height:38px;border:1px solid #b5c9bc;border-radius:7px;padding:.35rem .7rem;background:white;color:var(--yotion-green);text-decoration:none;font:400 14px/1.35 Arial,sans-serif}
.queue-link:hover{background:#edf3e9}
.queue-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(9rem,1fr));gap:.8rem;margin-bottom:1.35rem}
.queue-metric{display:grid;gap:.4rem;align-content:start;background:white;border:1px solid var(--yotion-line);border-radius:var(--yotion-radius);
  padding:.82rem 1rem;color:var(--yotion-ink);text-decoration:none;box-shadow:var(--yotion-shadow)}
.queue-metric.attention{box-shadow:inset 3px 0 #bc8136,var(--yotion-shadow)}
.queue-metric.selected{border-color:#749b86;background:#eef4e9}.queue-metric:hover{border-color:#8ba897}
.queue-metric strong{font:500 1.95rem/1 Arial,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.05em}
.queue-metric span{font-size:.86rem;font-weight:700;color:#385547}
.queue-panel{background:white;border:1px solid var(--yotion-line);border-radius:var(--yotion-radius);overflow:hidden;box-shadow:var(--yotion-shadow)}
.queue-tools{padding:.85rem 1rem;display:flex;justify-content:space-between;align-items:end;gap:.75rem 1rem;flex-wrap:wrap;border-bottom:1px solid var(--yotion-line)}
.queue-tools form{display:flex;align-items:end;gap:.5rem;flex-wrap:wrap;margin:0}
.queue-tools label{display:grid;gap:.25rem;font-size:.84rem;font-weight:700}
.queue-tools input{width:min(20rem,62vw);min-height:38px;padding:.38rem .65rem}
.queue-tools button{min-height:38px}
.queue-count{font-size:.87rem;color:var(--yotion-muted);margin:0 0 .4rem;font-variant-numeric:tabular-nums}
.queue-empty{padding:clamp(1.25rem,4vw,2.4rem)}.queue-empty h2{font-size:1.2rem}.queue-empty p{margin:.4rem 0 0;color:var(--yotion-muted)}
.queue-notice{padding:.65rem .85rem;background:#edf3e9;border-left:3px solid var(--yotion-green);border-radius:4px}
.admin-content :is(.columns,.request-columns){background:#f0f4ed;color:#345048;font-size:.82rem;letter-spacing:.012em}
.admin-content :is(.row,.request-grid):not(.request-columns){min-height:3.65rem}
.admin-content :is(.badge,.request-badge){padding:.22rem .5rem;border-radius:999px;font-size:.8rem}
.admin-content :is(.date,.received,.plan small){font-variant-numeric:tabular-nums}
.admin-content .views{gap:1.1rem}.admin-content .views a{padding:.55rem .15rem .7rem}
@media(max-width:520px){.queue-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.queue-metric{padding:.75rem}.queue-tools input{width:min(100%,62vw)}}
`;

export function queueMetrics(items: { label: string; value: number; href: string; selected?: boolean; attention?: boolean }[]) {
  return `<nav class="queue-metrics" aria-label="Filter the work queue">${items.map(item =>
    `<a href="${esc(item.href)}" class="queue-metric${item.attention ? " attention" : ""}${item.selected ? " selected" : ""}"${item.selected ? ' aria-current="true"' : ""}>
      <span>${esc(item.label)}</span><strong>${item.value}</strong></a>`
  ).join("")}</nav>`;
}
