# Standard artist oil paints — reference colours for PaintPlan's Limited Palette

Generated data: `src/core/paint-library.js` (built by `research/build-library.py` from `research/mixura-oil-raw.json`,
also dumped to `research/paint-library.json`). **60 paints: 47 from published per-brand L\*a\*b\* data
(averaged), 13 approximate.** None of them were measured by us, and none can be called lab-verified
spectrophotometer data. The details are below.

## What I looked for, and what exists

| Source | What it has | Used? |
|---|---|---|
| **mixura.app colour pages** (`mixura.app/paints/<colour>/`, retrieved 2026-10-11) | Per brand and line: hex, CIE L\*a\*b\*, pigment codes, opacity and lightfastness for 56 colour names, across oil, acrylic, watercolour and gouache. The site says "measured in CIE L\*a\*b\*". | **Yes**. The primary source for colour, pigment codes and opacity. |
| Kovacs-Vajna, *Color Mixing Tools* (Univ. Brescia) | Kubelka-Munk ramps and masstone spectra for W&N Artists' Oils (Paladini; C. Skeel's 62 bases) and Gamblin Conservation Colors (M. Haddock, RIT thesis 2011). | No. The data sits inside their tools and there is no downloadable table. It's the best lead for real K-M data later. |
| RIT Munsell Color Science Lab *Artist Spectral Database* (Okumura 2005; Berns et al.) | Two-constant K-M data (with Saunderson correction) from masstone and tint drawdowns. | No. It covers **acrylics** (Golden), not oils. |
| Mixbox (Sochorová & Jamriška, SIGGRAPH Asia 2021) | sRGB for 13 pigments used as K-M primaries (e.g. Cad Yellow 254,236,0; Phthalo Blue 13,27,68; Ultramarine 25,0,89). | Cross-check only. They are thick masstones (very dark for transparent paints) tuned for that engine. |
| Gamblin colour chart (PDF) | Pigment codes. | Used to cross-check pigment codes. |
| ColorWell.org, Centore | Munsell notations; Centore measured soft pastels. | No (not oils / not machine-readable). |

### How reliable is the mixura data?
* **Good:** the values are per brand and per line, pigment codes match the manufacturers' charts, and brands agree with
  each other (typical spread ΔE 2–6 from the cross-brand mean).
* **Caveats (why it's labelled "reference", not "measured"):** the measurement method isn't published (no instrument, film
  thickness, backing or illuminant). The L\*a\*b\* values look computed *from* the hex codes: neutral blacks come out at exactly
  a\*=b\*=0, and the hexes are round (`#1c1c1c`, `#fcfcfa`). Several brands carry identical values (Old Holland =
  Williamsburg on many colours). These look like curated swatch colours, not raw spectrophotometer readings.
* The dark transparent paints (Phthalo, Prussian, Dioxazine, Ultramarine) come out **much lighter than a thick masstone**
  (Phthalo Blue L\*≈26 vs ≈10–15 for a thick film). So these values behave like a *"mixing colour"* (thin film / undertone),
  which is what a reflectance-mixing model needs. I kept them as the colour used for swatches and mixing. For those paints
  I added an approximate thick-film `mass` colour for display only (the corner of the picker swatch).

## Method
1. I scraped every colour page and kept rows with medium = oil. Raw rows: `research/mixura-oil-raw.json`.
2. I kept artist-grade lines only (Gamblin Artist's, W&N Artists', Michael Harding, Old Holland, Williamsburg, Holbein,
   Rembrandt, Schmincke Mussini, Sennelier Artists', M. Graham, Lukas 1862, Maimeri Puro, Daler-Rowney Georgian). I dropped
   student and water-mixable lines and counted identical published values once.
3. Mean in L\*a\*b\* → sRGB (D65). `k` = number of brands, `dE` = largest ΔE76 of a brand from the mean (how much tubes vary).
4. Opacity = the most common rating across those brands. Pigment codes come from the same rows and the manufacturer charts.
5. **Approximate** entries are paints mixura doesn't list (Flake White, English Red, the transparent oxides, Cadmium Lemon,
   Alizarin and Permanent Alizarin, Quinacridone Rose, Cobalt Violet, Phthalo Blue RS, Manganese Blue Hue, Phthalo Green YS,
   Terre Verte). I estimated them from neighbouring published entries of the same or related pigment (e.g. PG36 shifted from
   PG7, PB15:1 shifted from PB15:3 toward PB29) and from brand charts. Treat them as eyeballed.
6. **Tinting strength `ts`** (used by the mixer) is an approximate, painter's-rule-of-thumb scale: Titanium White = 1,
   Phthalos 4, Prussian and Dioxazine 3.5, Quinacridones and PR254 2, Cadmiums 1.5, earths ≈1, Cobalt 0.7, Zinc 0.45,
   Terre Verte 0.3. It isn't measured. It's the right order of magnitude, and it's documented so it can be swapped for real
   K-M data (see the Kovacs-Vajna / Haddock lead).

## Mixing model (PaintPlan)
The mixer is a weighted geometric mean of linear-RGB reflectance (a cheap single-constant K-M stand-in). It now weights
each paint's volume share by `ts`, so 1 part Phthalo + 7 parts White stays a strong blue as it does on the palette. Recipes
still show **parts by volume** and are labelled approximate. Custom colours (no library paint) use ts = 1, so palettes made
only of custom colours mix exactly as before.

## Data (60 paints)
op: O opaque · SO semi-opaque · ST semi-transparent · T transparent. `mass` = approximate thick-film masstone (display only).

| Paint | CI pigment(s) | sRGB (mixing/ref) | L\*a\*b\* | op | ts | mass | Source | Note |
|---|---|---|---|---|---|---|---|---|
| Titanium White | PW6 | `#fefdfd` | 99.5, -0.1, 0.5 | O | 1.0 |  | ref (10 brands, max ΔE 0.7) |  |
| Zinc White | PW4 | `#fcfcfa` | 98.8, -0.3, 0.8 | ST | 0.45 |  | ref (13 brands, max ΔE 0.6) |  |
| Flake White (Lead) | PW1 | `#f4efe3` | — | O | 0.6 |  | approx | Warm lead white; hues use PW6/PW4. |
| Ivory Black | PBk9 | `#222223` | 13.2, 0.2, -0.4 | O | 1.5 |  | ref (12 brands, max ΔE 2.0) |  |
| Mars Black | PBk11 | `#1f1f20` | 11.9, 0.1, -0.2 | O | 2.5 |  | ref (8 brands, max ΔE 3.5) |  |
| Lamp Black | PBk6/PBk7 | `#1c1c1d` | 10.4, 0.1, -0.3 | O | 2.2 |  | ref (9 brands, max ΔE 1.8) |  |
| Payne’s Gray | PB29+PBk9 | `#30343f` | 21.8, 1.5, -7.6 | ST | 2.0 |  | ref (10 brands, max ΔE 3.8) |  |
| Yellow Ochre | PY43/PY42 | `#c39c48` | 66.4, 5.2, 48.7 | O | 1.0 |  | ref (12 brands, max ΔE 2.4) |  |
| Raw Sienna | PBr7 | `#b1753d` | 54.4, 18.1, 40.0 | T | 0.9 |  | ref (12 brands, max ΔE 4.4) |  |
| Burnt Sienna | PBr7/PR101 | `#974a31` | 40.8, 30.0, 29.3 | T | 1.1 |  | ref (12 brands, max ΔE 6.1) |  |
| Raw Umber | PBr7 | `#63543d` | 36.7, 2.5, 16.0 | T | 1.3 |  | ref (12 brands, max ΔE 2.7) |  |
| Burnt Umber | PBr7 | `#573828` | 26.7, 11.8, 15.5 | ST | 1.3 |  | ref (12 brands, max ΔE 2.3) |  |
| Van Dyke Brown | PBr7+PBk9 | `#463026` | 22.2, 8.5, 10.4 | T | 1.4 |  | ref (3 brands, max ΔE 3.3) |  |
| Venetian Red | PR101 | `#8f3a35` | 36.2, 35.5, 21.3 | O | 1.8 |  | ref (11 brands, max ΔE 5.9) |  |
| Indian Red | PR101 | `#8c3439` | 34.7, 37.7, 16.9 | O | 2.0 |  | ref (9 brands, max ΔE 3.9) |  |
| English Red | PR101 | `#a7452e` | — | O | 1.8 |  | approx | Lighter, more orange PR101 than Indian Red. |
| Transparent Red Oxide | PR101 (transparent) | `#8e3b1f` | — | T | 1.6 | #4a1d10 | approx | Transparent synthetic iron oxide; glazing substitute for Burnt Sienna. |
| Transparent Yellow Oxide | PY42 (transparent) | `#b9782c` | — | T | 1.3 | #6a3f15 | approx | Transparent synthetic iron oxide. |
| Naples Yellow | PY41 / PW+PY42+PR101 (hue) | `#f8da8c` | 88.0, 0.3, 42.0 | O | 0.8 |  | ref (10 brands, max ΔE 8.4) |  |
| Cadmium Lemon | PY35 | `#fff000` | — | O | 1.4 |  | approx | Greenish cadmium; value interpolated from Cadmium Yellow Light. |
| Cadmium Yellow Light | PY35/PY37 | `#ffe80d` | 91.1, -10.1, 89.1 | O | 1.5 |  | ref (11 brands, max ΔE 5.9) |  |
| Cadmium Yellow Medium | PY35/PY37 | `#ffd30d` | 85.9, 0.3, 85.3 | O | 1.5 |  | ref (8 brands, max ΔE 4.2) |  |
| Cadmium Yellow Deep | PY37/PO20 | `#ffb806` | 79.3, 14.3, 81.3 | O | 1.5 |  | ref (11 brands, max ΔE 4.9) |  |
| Hansa Yellow Light (Lemon) | PY3 | `#fff728` | 95.1, -17.2, 88.2 | ST | 1.4 |  | ref (7 brands, max ΔE 5.1) |  |
| Hansa Yellow Medium | PY74/PY97 | `#ffe121` | 89.5, -6.6, 85.1 | SO | 1.5 |  | ref (2 brands, max ΔE 3.9) |  |
| Indian Yellow | PY83/PY153 | `#ffb228` | 77.9, 17.9, 74.2 | T | 1.3 |  | ref (11 brands, max ΔE 1.6) |  |
| Cadmium Orange | PO20 | `#ff7a2d` | 66.0, 46.5, 62.1 | O | 1.5 |  | ref (12 brands, max ΔE 13.9) |  |
| Transparent Pyrrole Orange | PO71 | `#ff7d2b` | 66.7, 44.8, 63.5 | T | 1.8 |  | ref (8 brands, max ΔE 5.8) |  |
| Cadmium Red Light | PR108 | `#f74138` | 56.0, 67.8, 46.9 | O | 1.5 |  | ref (11 brands, max ΔE 6.4) |  |
| Cadmium Red Medium | PR108 | `#e03333` | 50.0, 65.0, 42.2 | O | 1.5 |  | ref (8 brands, max ΔE 4.2) |  |
| Cadmium Red Deep | PR108 | `#b62531` | 40.4, 56.6, 30.5 | O | 1.5 |  | ref (12 brands, max ΔE 8.2) |  |
| Pyrrole Red | PR254 | `#d32d33` | 47.0, 63.1, 38.4 | SO | 2.0 |  | ref (6 brands, max ΔE 6.2) |  |
| Alizarin Crimson | PR83 | `#9a2236` | — | T | 2.0 | #3e1018 | approx | Fugitive PR83; average of brand-chart colours, approximate. |
| Permanent Alizarin Crimson | PR177/PV19 (varies) | `#9c2238` | — | T | 2.0 | #401119 | approx | Lightfast substitute; formulas vary by brand. |
| Quinacridone Red | PV19 | `#c42845` | 43.8, 60.8, 23.1 | T | 2.0 |  | ref (5 brands, max ΔE 2.1) |  |
| Quinacridone Rose | PV19 (gamma) | `#d1365f` | — | T | 2.0 |  | approx | Bluish PV19; between Quin Red and Quin Magenta. |
| Quinacridone Magenta | PR122 | `#b52c5f` | 41.9, 57.3, 3.9 | T | 2.0 | #52122b | ref (7 brands, max ΔE 1.9) |  |
| Quinacridone Violet | PV19 | `#7a2e54` | 31.2, 37.4, -6.1 | T | 2.0 | #35121f | ref (10 brands, max ΔE 12.1) |  |
| Dioxazine Purple | PV23 | `#4e2767` | 23.8, 30.6, -30.4 | T | 3.5 | #1c0f26 | ref (3 brands, max ΔE 2.4) |  |
| Ultramarine Violet | PV15 | `#593a74` | 30.6, 25.9, -28.3 | ST | 0.7 |  | ref (11 brands, max ΔE 5.6) |  |
| Cobalt Violet | PV14/PV49 | `#8b4f9f` | — | ST | 0.5 |  | approx | Weak, expensive pigment; hues common. |
| Ultramarine Blue | PB29 | `#263b97` | 28.8, 25.4, -52.6 | ST | 1.2 | #1a1f5a | ref (5 brands, max ΔE 2.0) |  |
| Cobalt Blue | PB28 | `#0155a7` | 36.6, 11.0, -49.7 | ST | 0.7 |  | ref (11 brands, max ΔE 4.5) |  |
| Cerulean Blue | PB35/PB36 | `#2988b9` | 53.6, -10.1, -33.7 | O | 0.8 |  | ref (11 brands, max ΔE 6.8) |  |
| Prussian Blue | PB27 | `#122c53` | 18.1, 5.9, -26.9 | T | 3.5 | #0e1626 | ref (12 brands, max ΔE 6.6) |  |
| Phthalo Blue (Green Shade) | PB15:3 | `#003795` | 26.5, 24.2, -55.3 | T | 4.0 | #0b1838 | ref (6 brands, max ΔE 2.2) |  |
| Phthalo Blue (Red Shade) | PB15:1/PB15:6 | `#16318f` | — | T | 4.0 | #0d1440 | approx | Redder PB15; shifted from the PB15:3 data toward Ultramarine. |
| Indigo | PB15+PBk/PV mixes | `#252f4a` | 19.5, 4.5, -18.2 | T | 2.5 |  | ref (7 brands, max ΔE 6.6) |  |
| Cobalt Turquoise | PB36 | `#00989f` | 56.9, -30.2, -13.6 | O | 0.8 |  | ref (6 brands, max ΔE 2.9) |  |
| Manganese Blue Hue | PB15+PG7(+PW6) | `#1d97c3` | — | T | 2.5 |  | approx | Original PB33 discontinued; phthalo-based hue. |
| Phthalo Green (Blue Shade) | PG7 | `#00625a` | 36.7, -26.3, -2.7 | T | 4.0 | #0b221d | ref (6 brands, max ΔE 1.2) |  |
| Phthalo Green (Yellow Shade) | PG36 | `#00785a` | — | T | 3.5 | #0f2a1c | approx | PG36; yellower than PG7. |
| Viridian | PG18 | `#0d7360` | 42.9, -31.5, 2.6 | T | 0.8 | #0f2f28 | ref (11 brands, max ΔE 6.6) |  |
| Chromium Oxide Green | PG17 | `#5a774f` | 47.0, -19.1, 19.1 | O | 1.2 |  | ref (7 brands, max ΔE 1.3) |  |
| Cobalt Green | PG50/PG26 | `#15876b` | 50.1, -37.0, 6.7 | ST | 0.6 |  | ref (11 brands, max ΔE 9.3) |  |
| Permanent Green Light | PG36+PY3 | `#84ba44` | 69.7, -36.5, 52.5 | ST | 2.0 |  | ref (8 brands, max ΔE 19.7) |  |
| Sap Green | mixed (PG7/36 + yellows/browns) | `#52652f` | 40.0, -16.6, 28.1 | T | 1.5 | #26301a | ref (10 brands, max ΔE 2.4) |  |
| Green Gold | PY129 | `#948f33` | 58.3, -10.2, 48.1 | T | 1.2 |  | ref (5 brands, max ΔE 5.6) |  |
| Olive Green | mixed | `#626237` | 40.4, -7.1, 24.4 | ST | 1.4 |  | ref (8 brands, max ΔE 1.9) |  |
| Terre Verte | PG23 | `#717c5d` | — | ST | 0.3 |  | approx | Very weak tinter; brand hues vary widely. |

## Updating
Edit the table in `research/build-library.py` (or refresh `mixura-oil-raw.json`), then run
`python3 research/build-library.py && node build.mjs`.
