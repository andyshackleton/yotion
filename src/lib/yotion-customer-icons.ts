const paths = {
  school: '<path d="m3 10 9-6 9 6M5 9v11h14V9M10 20v-6h4v6"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  car: '<path d="m5 11 2-5h10l2 5M4 11h16v7H4zM6 18v2m12-2v2M7 14h2m6 0h2"/>',
  message: '<path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.5-3A7.5 7.5 0 1 1 20 11.5Z"/><path d="M9 11h7m-7 3h4"/>',
  pen: '<path d="m14 6 4 4M4 20l4-1L20 7l-3-3L5 16l-1 4Z"/>',
  star: '<path d="m12 3 2.7 5.6 6.3.9-4.5 4.4 1.1 6.1-5.6-3-5.6 3 1.1-6.1L3 9.5l6.3-.9L12 3Z"/>',
  calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M8 4v4m8-4v4M4 11h16m-11 4h2m2 2h2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  alert: '<path d="M12 8v5m0 3v.5"/><circle cx="12" cy="12" r="9"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  launch: '<path d="M12 3v13m-5-8 5-5 5 5M5 14v6h14v-6"/>',
};
export type CustomerIcon = keyof typeof paths;
export const customerIcon = (name: CustomerIcon) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
