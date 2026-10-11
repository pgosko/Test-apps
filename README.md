# Test-apps

A collection of small, self-contained web apps. **Each subfolder is one app** (a single `index.html` plus its PWA files: `manifest.webmanifest`, `sw.js` and icons).

| App | Folder | Live |
| --- | --- | --- |
| PaintPlan: plan & practise paintings from a photo | [`paintplan/`](paintplan/) | https://pgosko.github.io/Test-apps/paintplan/ |
| Film Grain Lab: film, lens & darkroom simulator | [`film-grain-lab/`](film-grain-lab/) | https://pgosko.github.io/Test-apps/film-grain-lab/ |

Landing page: https://pgosko.github.io/Test-apps/

Served with GitHub Pages from `main` (root). `.nojekyll` disables Jekyll processing.

## Add to Home Screen (iPhone)

1. Open the app's link in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Launch it from the new icon. It runs full screen without the browser UI and works offline after the first load.

## Adding a new app

Create a new folder with an `index.html`, copy `manifest.webmanifest`, `sw.js` and the icons from an existing app and adjust names and colours. When you update an app, bump `VERSION` in its `sw.js` so installed copies pick up the new files.
