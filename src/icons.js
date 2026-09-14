const paths = {
  mouse:
    '<circle cx="6" cy="6" r="4"/><circle cx="18" cy="6" r="4"/><path d="M5 13a7 7 0 0 1 14 0c0 5-5 9-7 9s-7-4-7-9Z"/><path d="M9 13h.01M15 13h.01M11 17h2"/>',
  plate:
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="4"/><path d="M2 3v7m-1-7v4h3V3m-2 7v11M22 3v18m0-18c-4 4-4 8 0 8"/>',
  knife: '<path d="m4 21 6-6-2-2-6 6 2 2Zm4-8L19 2c4 5 1 9-7 14l-4-3Z"/>',
  pan: '<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="4"/><path d="m15 15 7 7-2 1-7-7"/>',
  pepper: '<path d="M14 5c1-3 3-3 5-2M15 5c7 5 3 15-12 15 7-3 4-8 7-12 1-2 3-3 5-3Z"/>',
  pressure: '<path d="M9 2h6v5l3 4v10H6V11l3-4V2Zm0 3h6M6 13h12M9 17h6"/>',
  clean: '<path d="m3 15 12-8 6 8-12 7-6-7ZM5 17l12-8M5 3v4M3 5h4M19 2v4m-2-2h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  heart: '<path d="M12 21 3 12C-3 5 7-2 12 5c5-7 15 0 9 7l-9 9Z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14 7h-4v5h4v5h-4m2-12v14"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z"/>',
  order: '<path d="M5 4h14v18H5V4Zm4-2h6v4H9V2Zm-1 8h8m-8 4h8m-8 4h5"/>',
  oven: '<path d="M3 4h18v18H3V4Zm0 5h18M7 6h.01M11 6h.01M7 13h10v5H7v-5M9 1v1m6-1v1"/>',
  arrow: '<path d="m8 3 9 9-9 9M3 12h13"/>',
  lock: '<rect x="5" y="10" width="14" height="12" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  play: '<path d="m7 3 14 9-14 9V3Z"/>',
  pause: '<path d="M7 4v16M17 4v16"/>',
  trophy:
    '<path d="M7 3h10v6c0 7-10 7-10 0V3Zm10 2h4v4c0 3-4 4-5 4M7 5H3v4c0 3 4 4 5 4m6 0v7m-5 1h8"/>',
  speed: '<path d="m14 2-9 12h6l-1 8L20 9h-7l1-7ZM2 6h5M1 10h3"/>',
  range: '<path d="M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5M8 12h8m-4-4v8"/>',
  capacity: '<path d="M3 17h18M5 13h14M7 9h10M5 21h14M12 3v3M9 4h6"/>',
  bell: '<path d="M4 18h16c-3-3-2-5-3-9-1-5-9-5-10 0-1 4 0 6-3 9ZM10 21h4M12 2v2"/>',
  portal: '<ellipse cx="12" cy="12" rx="7" ry="10"/><ellipse cx="12" cy="12" rx="4" ry="7"/>',
  settings:
    '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="19" r="2"/>',
  volume: '<path d="M3 9h4l6-5v16l-6-5H3V9Zm14-2c4 3 4 7 0 10m2-13c6 5 6 11 0 16"/>',
  check: '<path d="m4 12 5 5L21 5"/>',
  burger:
    '<path d="M3 10c0-10 18-10 18 0H3Zm0 4h18M3 18c0 5 18 5 18 0H3ZM8 6h.1M13 4h.1M16 7h.1"/>',
  pizza:
    '<path d="m12 2 10 18c-6 4-14 4-20 0L12 2Zm-9 16c6 4 12 4 18 0M11 10h.1M8 16h.1M15 15h.1"/>',
  soup: '<path d="M2 12h20c-1 12-19 12-20 0Zm3 10h14M7 2c-3 3 3 4 0 7m5-7c-3 3 3 4 0 7m5-7c-3 3 3 4 0 7"/>',
  cheese: '<path d="m3 12 14-9 4 10v8H3v-9Zm0 0 18 1M7 17h.1M15 18h.1M13 9h.1"/>',
};
const aliases = {
  dash: 'speed',
  hands: 'order',
  robot: 'clean',
  belt: 'capacity',
  decor: 'star',
  vip: 'star',
  student: 'order',
  regular: 'heart',
  tips: 'coin',
  boulevard: 'range',
  express: 'speed',
  reload: 'speed',
  reach: 'range',
  might: 'star',
  health: 'heart',
  damage: 'knife',
  cook: 'oven',
  served: 'plate',
  kills: 'knife',
  wave: 'clock',
  wins: 'trophy',
  hard_wins: 'trophy',
};
export function icon(id, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[aliases[id] || id] || paths.star}</svg>`;
}
export const dishIcon = (id) => icon(['burger', 'pizza', 'soup', 'cheese'][id]);
export function customerPortrait(kind = 'normal') {
  const extra =
    kind === 'student'
      ? '<circle cx="8.8" cy="12.5" r="2.8"/><circle cx="15.2" cy="12.5" r="2.8"/><path d="M11.6 12.5h.8"/>'
      : kind === 'vip'
        ? '<circle cx="15" cy="13" r="3"/><path d="m17 15 2 5M9 20l3-2 3 2-3 1-3-1Z"/>'
        : kind === 'regular'
          ? '<path d="M7 19h10m-9 1 2 3 2-3"/>'
          : '';
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths.mouse}${extra}</svg>`;
}
