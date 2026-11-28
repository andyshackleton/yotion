import { escapeOrderHtml as esc } from "./yotion-order-progress";

export const queueStyles = `
.queue-header{display:flex;justify-content:space-between;align-items:end;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap}
.queue-header p{margin:.35rem 0 0;max-width:40rem;color:var(--yotion-muted)}
.queue-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;border:1px solid #b5c9bc;border-radius:7px;padding:.45rem .75rem;background:white;color:var(--yotion-green);text-decoration:none;font:400 15px Arial,sans-serif}
.queue-link:hover{background:#edf3e9}
.queue-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(10rem,1fr));gap:1rem;margin-bottom:1.5rem}
.queue-metric{display:grid;gap:.15rem;background:white;border:1px solid var(--yotion-line);border-top:3px solid #a9c7b2;border-radius:9px;padding:.8rem 1rem;color:var(--yotion-ink);text-decoration:none}
.queue-metric.attention{border-top-color:#bc8136}.queue-metric.selected{border-color:var(--yotion-green);background:#edf3e9}.queue-metric:hover{box-shadow:0 2px 8px #203a3414}
.queue-metric strong{font:500 1.8rem/1.2 Arial,sans-serif}.queue-metric span{font-size:.9rem}
.queue-panel{background:white;border:1px solid var(--yotion-line);border-radius:10px;overflow:hidden}
.queue-tools{padding:.85rem 1rem;display:flex;justify-content:space-between;align-items:center;gap:.75rem 1rem;flex-wrap:wrap;border-bottom:1px solid var(--yotion-line)}
.queue-tools form{display:flex;align-items:end;gap:.5rem;flex-wrap:wrap;margin:0}.queue-tools label{display:grid;gap:.15rem;font-size:.85rem;font-weight:700}
.queue-tools input{width:min(19rem,65vw);min-height:40px;padding:.45rem .6rem;border:1px solid #8ba295;border-radius:6px;font:400 15px Arial,sans-serif}
.queue-count{font-size:.9rem;color:var(--yotion-muted);margin:0}
.queue-empty{padding:clamp(1rem,4vw,2rem)}.queue-empty p{margin:.45rem 0 0;color:var(--yotion-muted)}
.queue-notice{padding:.65rem .85rem;background:#edf3e9;border-left:3px solid var(--yotion-green)}
`;

export function queueMetrics(items: { label: string; value: number; href: string; selected?: boolean; attention?: boolean }[]) {
  return `<nav class="queue-metrics" aria-label="Filter the work queue">${items.map(item =>
    `<a href="${esc(item.href)}" class="queue-metric${item.attention ? " attention" : ""}${item.selected ? " selected" : ""}"${item.selected ? ' aria-current="true"' : ""}>
      <span>${esc(item.label)}</span><strong>${item.value}</strong></a>`
  ).join("")}</nav>`;
}
