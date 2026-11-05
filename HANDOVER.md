# Antigravity handover

## What this is
A mobile-first React and Vite preview of the Urban Company AC booking experience. It was built from the two requested Figma sections only: **Urban combanyscreen shots** and **Urban combanydesign system**.

## What is included
- `src/` — React screens, interactions, styles, and design tokens.
- `public/assets/` — image and icon assets used by the app.
- `dist/` — ready-built preview.
- `package.json` and `package-lock.json` — dependencies and run scripts.
- `README.md` — quick start.

## Main app content
Home and AC service browsing; diagnosis and UC Cover information; service, repair/gas refill, installation/uninstallation; Foam-jet packages for 2, 3, 4, and 5 ACs; details and AC type choice; cart; professional choice; date/time selection; and payment summary.

The cart is stored in the browser. Prices, ratings, durations, copy, and photos are reference material from the supplied screenshots. They are not live service data. Payment is a non-functional preview.

## Run it
1. Unzip this folder.
2. Open a terminal in `urban-company-mobile-app`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local URL Vite prints, usually `http://localhost:5173`.

To make a production build, run `npm run build`. The result is written to `dist/`.

## Antigravity continuation
Treat the supplied Urban Company screenshots and design system as the visual source. Keep the app mobile-first and retain the service details, images, prices, and booking steps. Replace reference values with live data only when a real data source is provided. Do not claim that checkout processes a real payment.
