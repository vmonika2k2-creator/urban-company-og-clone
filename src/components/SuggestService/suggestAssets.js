/* Icons and illustrations for the Suggest a service screen. Plain SVG strings. */

export const ICONS = {
  power:  '<path d="M12 3v9"/><path d="M6.5 6.6a8 8 0 1 0 11 0"/>',
  fan:    '<circle cx="12" cy="12" r="2"/><path d="M12 10V4.6a2.5 2.5 0 1 1 2.4 2.5H12z"/><path d="M14 12h5.4a2.5 2.5 0 1 1-2.5 2.4V12z"/><path d="M12 14v5.4a2.5 2.5 0 1 1-2.4-2.5H12z"/><path d="M10 12H4.6a2.5 2.5 0 1 1 2.5-2.4V12z"/>',
  snow:   '<path d="M12 4v16M5 8l14 8M19 8L5 16"/><path d="M12 7l-2-2M12 7l2-2M12 17l-2 2M12 17l2 2"/>',
  sound:  '<path d="M4 9v6h3l5 4V5L7 9H4z"/><path d="M16 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/>',
  smell:  '<path d="M8 19c0-2 2-2.5 2-4.5S8 12 8 10"/><path d="M12 19c0-2 2-2.5 2-4.5S12 12 12 10"/><path d="M16 19c0-2 2-2.5 2-4.5S16 12 16 10"/>',
  drop:   '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  alert:  '<path d="M12 3l9.5 17H2.5L12 3z"/><path d="M12 9.5v5"/><path d="M12 17.6v.1"/>',
  ice:    '<path d="M12 4v16M5 8l14 8M19 8L5 16"/>',
  gauge:  '<path d="M4 17a8 8 0 1 1 16 0"/><path d="M12 17l4-5"/><circle cx="12" cy="17" r="1.6"/>',
  wrench: '<path d="M20 5.5a4.5 4.5 0 0 1-6 4.2L6.8 17a2.4 2.4 0 1 0 3.4 3.4l7.3-7.2A4.5 4.5 0 0 1 21 6.5z"/>',
  clock:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-3.6-3.6"/>',
  rupee:  '<path d="M7 5h10M7 9h10M15 5c0 4.2-3 4.2-8 4.2l8 9.8"/>',
  wind:   '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 16h14a3 3 0 1 1-3 3"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
  check:  '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus:   '<path d="M12 5v14M5 12h14"/>',
  x:      '<path d="M6 6l12 12M18 6L6 18"/>',
  spark:  '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'
};
export const ico = (n, s = 16, sw = 2) =>
  `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor"
        stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

export const ILLOS = {
  /* 1 · approve — phone with a lime approval screen */
  approve: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="16" y="8" width="32" height="48" rx="6" fill="#fff" stroke="#1F1A1D" stroke-width="2.2"/>
    <rect x="20" y="14" width="24" height="24" rx="3" fill="#F4F9DC"/>
    <path d="M25 26 L29 30 L39 20" fill="none" stroke="#1F1A1D" stroke-width="2.6"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="24" y1="44" x2="40" y2="44" stroke="#B8A9B0" stroke-width="2" stroke-linecap="round"/>
    <circle cx="32" cy="50" r="2" fill="#1F1A1D" opacity=".4"/>
  </svg>`,

  /* 2 · technician visit — person with cap + toolbox, AC in background */
  tech: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="4" y="8" width="24" height="10" rx="2.5" fill="#E6F1FB" stroke="#1F1A1D" stroke-width="1.8"/>
    <line x1="8" y1="13" x2="24" y2="13" stroke="#1F1A1D" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
    <circle cx="24" cy="24" r="7" fill="#FDECDC" stroke="#1F1A1D" stroke-width="2"/>
    <path d="M17 22 Q24 14 31 22" fill="#1F1A1D" stroke="#1F1A1D" stroke-width="1.4" stroke-linejoin="round"/>
    <rect x="22" y="15" width="4" height="5" fill="#1F1A1D"/>
    <path d="M18 32 Q24 30 30 32 L30 46 L18 46 Z" fill="#1F1A1D"/>
    <line x1="21" y1="46" x2="21" y2="56" stroke="#1F1A1D" stroke-width="3" stroke-linecap="round"/>
    <line x1="27" y1="46" x2="27" y2="56" stroke="#1F1A1D" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 34 Q36 35 40 38" fill="none" stroke="#1F1A1D" stroke-width="3" stroke-linecap="round"/>
    <rect x="38" y="38" width="20" height="15" rx="2" fill="#FBE6EE" stroke="#1F1A1D" stroke-width="2"/>
    <path d="M43 38 V34 Q43 32 45 32 H51 Q53 32 53 34 V38" fill="none" stroke="#1F1A1D" stroke-width="1.8"/>
    <line x1="48" y1="38" x2="48" y2="53" stroke="#1F1A1D" stroke-width="1" opacity=".4"/>
  </svg>`,

  /* 3 · diagnosis + quote — clipboard with rupee, magnifier scanning */
  quote: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="10" y="10" width="32" height="46" rx="4" fill="#fff" stroke="#1F1A1D" stroke-width="2.2"/>
    <rect x="20" y="6" width="12" height="8" rx="2" fill="#1F1A1D"/>
    <line x1="16" y1="24" x2="36" y2="24" stroke="#5F5A5E" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="16" y1="30" x2="32" y2="30" stroke="#5F5A5E" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="16" y1="36" x2="28" y2="36" stroke="#5F5A5E" stroke-width="1.8" stroke-linecap="round"/>
    <text x="26" y="53" text-anchor="middle" font-size="14" font-weight="700"
          fill="#B1245F" font-family="Poppins, sans-serif">₹</text>
    <circle cx="46" cy="42" r="9" fill="#F4F9DC" stroke="#1F1A1D" stroke-width="2.2"/>
    <line x1="52" y1="48" x2="58" y2="54" stroke="#1F1A1D" stroke-width="2.8" stroke-linecap="round"/>
  </svg>`,

  /* 4 · repair — AC unit, wrench, lime sparkle */
  repair: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="4" y="8" width="30" height="14" rx="3" fill="#E6F1FB" stroke="#1F1A1D" stroke-width="2"/>
    <line x1="9" y1="15" x2="29" y2="15" stroke="#1F1A1D" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
    <g transform="translate(34,34) rotate(-40)">
      <rect x="-3" y="0" width="6" height="18" rx="2" fill="#1F1A1D"/>
      <path d="M-7 -2 Q-7 -8 -2 -8 L2 -8 Q7 -8 7 -2 L7 3 L3 3 L3 -1 Q3 -3 1 -3 L-1 -3 Q-3 -3 -3 -1 L-3 3 L-7 3 Z"
            fill="#1F1A1D"/>
    </g>
    <path d="M52 8 L54 14 L60 16 L54 18 L52 24 L50 18 L44 16 L50 14 Z"
          fill="#C8E64C" stroke="#1F1A1D" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`
};
