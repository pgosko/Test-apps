# Value-linked colour: change only the lightness of a colour photo

Feature branch `feature/value-color`. The Values level settings (steps, black/mid/white, dragged histogram boundaries)
drive the **lightness** of the full-colour photo. Painters call this a "value-grouped colour study": simplify the values
and keep the colours. Implementation: `src/worker/engine/value-color.js`. UI: Values → **Apply to colour photo**.

## 1. Which space to change "brightness" in

| Space | Problem when you change only lightness |
|---|---|
| **HSL / HSV** | "L" and "V" aren't perceptual lightness. Pure yellow and pure blue both have HSL L = 50 % but look very different (OKLCh L 0.97 vs 0.45, CSS Color 4). Editing L/V also changes the perceived saturation, and the hue is a hexagonal approximation. Not usable for value work. |
| **CIELAB / CIELCh** | L\* is the standard value scale (≈ Munsell value ×10), which is why PaintPlan's value study uses it. But hue lines aren't straight: blues drift toward purple when you change lightness or chroma at constant CIELAB hue (the well-known ~260–290° blue non-linearity; Hung & Berns 1995, Braun et al. 1998). Lightness and chroma also interact around saturated yellows. |
| **OKLab / OKLCh** (Ottosson 2020) | Built to be perceptually uniform with **straight hue lines**, and it fixes the CIELAB blue shift. It's cheap (a 3×3 matrix, a cube root, a 3×3 matrix), it's the gamut-mapping space in CSS Color 4, and PaintPlan already uses it for palette and mixing. **Chosen for hue and chroma.** |

**Value target vs OKLab L.** The value study measures CIE L\* (it depends only on luminance Y). OKLab L is close but not
identical for saturated colours. So I keep OKLab **a,b unchanged** (hue and chroma exact) and **solve OKLab L** so that the
pixel's luminance matches the target L\*. Y is a cubic polynomial in OKLab L for fixed a,b, so Newton's method converges
in 2–4 steps from the guess L·∛(Y_t/Y_o), which is exact for neutrals. The result: the colour photo's gray version equals
the value study, and hue and chroma don't move.

**Luminance-preserving vs chroma-preserving.** These are the classic alternatives:
* *Scale RGB by Y_t/Y_o* (luminance ratio, as in "luminosity" blend modes). Hue is roughly kept, but chroma scales with
  lightness: darkening desaturates, lightening clips quickly. Not "only brightness".
* *Keep relative saturation (C/L constant)*. This looks natural in some tone-mapping work, but it changes chroma, which the
  brief rules out.
* **Keep absolute OKLab chroma and hue, change L only** (chosen). This matches "only the brightness changes" perceptually,
  and chroma is touched only when the colour can't be displayed (next section).

## 2. Gamut: lightness changes can leave sRGB
Lighten a saturated blue or darken a bright yellow and the same chroma no longer exists in sRGB at the new lightness.
Options:
* **Per-channel clipping** shifts the hue (e.g. a light blue goes cyan or purple) and changes the value. Rejected.
* **CSS Color 4 gamut mapping**: in OKLCh, keep L and h and binary-search the chroma down. Its "JND 0.02" refinement accepts a
  clipped colour within ΔE_OK 0.02 to keep a bit more chroma.
* **Ottosson's gamut clipping** (projection toward L=0.5 or the cusp, with an adaptive α): an analytic intersection, faster,
  but it trades a little lightness for chroma.
* **Chosen: chroma reduction at constant hue and constant luminance.** Binary search (12 steps) on the chroma scale k ∈ [0,1].
  For every k, OKLab L is re-solved so luminance stays on target. k = 0 (gray at the target luminance) is always in gamut,
  so the search always succeeds. **Hue and value stay exact; only chroma drops, and only for those pixels.** I didn't use
  the CSS JND shortcut, because it would let the value drift by up to ΔE 0.02. The share of affected pixels is reported in
  the panel. An optional overlay hatches them in magenta ("Mark pixels that lost chroma").

## 3. Keeping detail inside a value step
Hard posterisation of lightness flattens texture and gives "cut-paper" banding. Standard fix: **base/detail decomposition**
(Durand & Dorsey 2002, bilateral filter; He et al. 2010, guided filter; Paris et al. 2011, local Laplacian filters):
* base B = an edge-preserving smooth version of L\*, detail D = L\* − B.
* Remap the base and add the detail back: L_out = G(B) + D·(d + (1−d)·G′(B)).
  * *Stepped*: G = the step function, G′ = 0, so L_out = step value + d·D. d = 0 gives flat value groups; d = 1 keeps all texture.
  * *Smooth*: G = the levels tone curve. d = 0 is a plain curve (texture contrast follows the curve slope); d = 1 keeps the
    original texture contrast even where the curve compresses.
* **Guided filter** (self-guided, radius scales with the image and with the Values pre-blur, ε = 6² L\*²): O(n) for any
  radius using box filters, no halos at strong edges (a Gaussian base would put halos around high-contrast edges once the
  detail is added back), and it's cached per image, so dragging the levels doesn't recompute it.
* Step membership uses the **same labels as the value study** (same pre-blur and "simplify shapes"), so the colour groups
  match the gray study and the step highlight works on the colour image.
* **Strength** blends the target with the original value: L_t = L + s·(L_out − L).

## 4. Tone curve for the Smooth mode
* Auto levels: exactly the black/mid/white curve the study uses, F(L) = 100·t^γ with t = (L − black)/(white − black) and
  γ set by the midpoint. With neutral settings it's the identity, so the image is unchanged.
* Custom (dragged) boundaries: boundary j maps to output j/N. Interpolation is **monotone cubic (Fritsch–Carlson)**, so the
  curve is smooth (no kinks that would show as gradient breaks) and never inverts values.
* Stepped "step values": **Even scale** (step centres, e.g. 10/30/50/70/90 % for 5 steps; default, keeps some colour in
  the darkest and lightest groups), **Same as value study** (0…100 %, the end groups become black and white), or
  **Group average** (each group's mean value: the least change).

## 5. Near-neutrals, banding, precision
* Near-neutrals: hue is undefined at C ≈ 0, but a and b aren't changed, so grays stay gray and noise isn't amplified.
  No special case is needed (an HSL/LCh hue-based method would need one).
* Banding: compressing or expanding tones in 8-bit creates bands, so the output gets a **triangular-PDF dither of ±1 LSB**.
  The **same noise value is applied to R, G and B** (it dithers lightness, not hue). Measured: independent per-channel
  dither doubled the hue error on low-chroma pixels (0.72° vs 0.37°); correlated dither stays at the 8-bit floor.
  Linear→sRGB uses a 16k-entry table.
* Live preview while dragging a histogram handle: half resolution (every other pixel in x and y), with the base layer and
  steps reused from cache. The full-quality pass runs on release. All of it runs in the existing Web Worker.

## 6. How painters' value-grouping tools work (context)
* Value-study apps and Photoshop recipes (Posterize on a luminosity layer, "Cutout" filters, Notanizer, ValueViewer, the
  "Luminosity blend of a posterised copy" trick): most posterise a **gray** copy or use luminosity blending (Photoshop's
  Luminosity mode keeps the colour layer's hue and saturation in a non-uniform HSY-like space, which shifts chroma).
* Painters' practice (Carlson, Schmid, the "3–5 value masses" approach): group the values into a few masses, then paint each
  mass in local colour **at the group's value**, keeping the hue and as much chroma as the value allows. That's this tool's
  Stepped mode with low texture. Smooth mode is the "value key" adjustment (high key / low key) without losing colour.

## 7. Recommendation (implemented)
OKLab hue and chroma kept; OKLab L solved per pixel for the target luminance (CIE L\* from the Values levels); in-gamut
pixels unchanged except for lightness; out-of-gamut pixels lose chroma at constant hue and luminance; the remap is applied
to a guided-filter base with detail added back (Keep texture slider); monotone tone curve in Smooth mode; correlated TPDF
dither; worker processing with a half-res live preview. Reasons: exact value (the colour image's gray = the value study),
exact hue (straight OKLab hue lines, no CIELAB blue shift), chroma kept wherever physically displayable, no halos, no
banding, interactive on phones.

## 8. Measured fidelity (headless Chrome, 1200 px working size; `test/value-color.js`)
"8-bit floor" = the error of the *ideal* colour (original a,b, exact luminance) after rounding to 8 bits, i.e. the best
any 8-bit output can do.

| Image | Mode | value error vs target | mean \|Δh\| in-gamut (floor) | mean \|ΔC\| OKLab (floor) | chroma-reduced pixels |
|---|---|---|---|---|---|
| real photo (forest river) | Stepped, texture 0 | 0.16 L\* (max 0.70) | 0.20° (0.18°) | 0.0005 (0.0004) | 0.7 % |
| real photo | Smooth, midpoint 35 | — | 0.23° (0.23°) | 0.0005 (0.0004) | 0.2 % |
| real photo | Smooth, midpoint 15 (heavy lightening) | — | all pixels 0.22° | — | 1.0 % |
| synthetic test painting | Stepped, texture 0 | 0.15 L\* (max 0.70) | 0.37° (0.24°) | 0.0004 (0.0003) | 0.0 % |

Smooth mode with neutral levels and full texture reproduces the original (mean |Δ| 0.25/255,
max 2). Engine time per full pass on 1.08 MP (desktop Chrome, main thread): about
409 ms the first time (including the guided base), about 83 ms for a live
half-res update. On an iPhone, expect roughly 2–4× that, which is why the live path is half-res and runs in the worker.

## References
* B. Ottosson, "A perceptual color space for image processing" (2020) and "sRGB gamut clipping" (2021), bottosson.github.io
* W3C, CSS Color Module Level 4, §13 Gamut mapping (OKLCh chroma reduction, JND 0.02); csswg-drafts issues #7135, #7653, #9715
* P.-C. Hung, R. Berns, "Determination of constant hue loci for a CRT gamut…" (1995): CIELAB blue hue non-linearity
* K. He, J. Sun, X. Tang, "Guided Image Filtering", ECCV 2010 / PAMI 2013
* F. Durand, J. Dorsey, "Fast bilateral filtering for the display of HDR images", SIGGRAPH 2002
* S. Paris, S. Hasinoff, J. Kautz, "Local Laplacian filters", SIGGRAPH 2011
* F. N. Fritsch, R. E. Carlson, "Monotone piecewise cubic interpolation", SIAM J. Numer. Anal. 1980
* R. Ulichney / standard audio-video practice: TPDF dither (±1 LSB) to remove quantisation banding
