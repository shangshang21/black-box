# ROUND 2 — Art director's decisions. You are now authorised to BUILD.

Thank you for round 1. It was excellent (the state-model, token-guarded timelines, reduced-motion, portrait grid and the three easter eggs especially). Below is what I (Claude, art director) accept, change and add. Where I say "decided", do not re-litigate; build it. Where you still see a real problem while building, make the best call yourself and write it in your report.

## Scope and rules

- You MAY edit: `v2/index.html` (the `<section id="hub">` markup, the hub-related CSS, and the single global rule `html, body { touch-action: none }` if you scope an override for the hub; do NOT touch the entry page's markup/rules or the transition code), `v2/hub.css`, `v2/hub.js`, and add files under `v2/` and `v2/assets/`.
- You MUST NOT edit `v2/scene.js`, `v2/sfx.js`, `v2/panels.js`, anything under `gen/` except writing your report/screenshots into `gen/r6/shots/` and `gen/r6/gpt-report-2.md`, or anything outside ``.
- Keep the public API: `window.BB = { openHub, select, onGhost? }` (preserve an externally supplied `onGhost`), and the dev switches `?hub=1&still=1&sel=N&c=...`. Add one more dev switch `&unlocked=1` that shows the settled state AFTER the ghost has been revealed (for screenshots).
- A backup of the previous version is at `gen/r6/backup-v2/`. Work in `v2/` directly.
- No new network dependencies. Vanilla JS + the already-loaded GSAP/Draggable/InertiaPlugin.
- The client will review ONLY the visuals (screenshots and the live page). Nobody will read your code, so optimise for what it looks and feels like, and for robustness, not for code elegance. Do not ask me questions; decide.

## The quality bar (unchanged, apply it to yourself every iteration)

以 Awwwards、Webby Awards、FWA 获奖网站为质量标准。完成后，从排版、留白、视觉层级、色彩、动效、微交互、响应式和原创性等方面自检并持续优化，直到页面没有明显可提升之处。

## Accepted from your round 1 (decided)

1. The wall is the interface: `s-plate-k.jpg` as background with the same lamp glow/burst/grain/dust language, extra ~1.08x zoom around the upper centre, a static translucent dark veil (25-35%, tune visually), keep ~1/3 of the composition as visible empty wall, 2-3 low-contrast cropped storyboard scraps at the edges (use `assets/pnl-*.webp`), no second fake floor. The wall and light are one transformed group.
2. Desktop composition: hero left, reading area right, quiet wall between (use your percentage table as the starting point; adjust by eye in screenshots). Hero = selected suspect's poster. Two smaller alternate posters; clicking one swaps it with the hero (the former hero takes the small slot). Initial hero = `window.Scene.who` if available (map luna→01, hound→02, smith→03), explicit `sel` wins, otherwise LUNA.
3. Dossier is the second focal point: content-driven height, reserved footer, small EXAMINED mark in the footer (never over the note), Chinese note at 17-18 px Noto Serif SC 600, line-height 1.65. Fix the desktop stamp/note overlap and the 390px overflow.
4. Stable numbered index (B-style buttons 01 / 02 / 03, 04 only after unlock).
5. Ghost slot appears only after all three dossiers have been fully read; it stays; click calls `BB.onGhost()` if defined, else a 200 ms local displacement and a `NO SIGNAL` system line. No finale.
6. Motion: your timelines (enter / switch / ghost reveal) are accepted as the baseline. Latest selection wins (token-guarded), examined is committed only after the reveal finishes. The wall does NOT shake; only the pasted poster recoils 1-2 px. Idle: dust, light, and a barely perceptible loose-corner breeze.
7. Thread: one quiet chain through the open corridor, never across text, 1.5-2 px red core with a thin dark under-stroke, small non-luminous pins, a loose tail that later fastens to the ghost. The thread is the only saturated element on the page.
8. Portrait 390x844: your grid (header, poster stage with swipe, numbered index, dossier, safe-area) and vertical scroll; no horizontal overflow; dragging disabled on portrait except the small corner-lift.
9. Reduced motion fallback as you specified (and listen for preference changes).
10. Robustness: invalid indices, rapid switching, image decode before swap, image failure fallback, resize/orientation changes.

## My changes and additions (decided)

A. **New clean posters (I am generating them now; do not generate images yourself).** Final filenames you must reference: `assets/hub-poster-luna.webp`, `hub-poster-hound.webp`, `hub-poster-smith.webp`, `hub-poster-ghost.webp`. They are text-free torn-paper portrait posters, roughly 4:5, transparent background, ~1100 px wide. **Right now these four files are placeholders** (copies of the old entry posters with baked text); I will overwrite them with the clean versions while you work, so: read each image's `naturalWidth/naturalHeight` at runtime and never hard-code an aspect ratio; do not rely on anything inside the placeholder art. All labels (codename, number, role) are live HTML on a reserved paper-margin or on a B-style label placed over the lower margin of the poster (design it so it works for any of the four).
B. **UI language, final:** BACK = the full approved B control (slanted black face on offset grey-paper slab, red triangle, hover = warm paper face + dark-red slab; copy the `.v-b` tokens exactly, they are in `index.html`). The index buttons 01/02/03(/04) are small B buttons too. SUSPECTS title = a quieter single black slanted bar (no red slash, no triangle), Anton. Dossier tags/status = small flat monochrome tags (no hover). Do NOT use the old ransom-note letter title anymore, and do not use the old outlined big numeral behind the hero.
C. **Keep the dossier draggable on desktop** (GSAP Draggable + Inertia), but constrained: drag only from a grip in the top margin, bounded to an "evidence area" so it can never cover BACK or the index, the thread follows while dragging. On portrait: no free drag; a small corner-lift toggle instead.
D. **Easter eggs: build all three** exactly as you specified (the three-second MODIFIED/OPENED reveal on activating the MODIFIED value; the shared two-staple scar under the lifted corner; the loose thread tail tug). They must be silent and unannounced (no tooltips, no hints). Keep them cheap.
E. **Sound:** at most one quiet `SFX.snap(.10)` at hero contact on a user-initiated switch. Never autoplay.
F. **Colour and contrast:** moderate. No pure white big areas; paper = warm grey (`#d3cfc3`-ish family), text on paper = near-black, dark red only on B hover. Keep the red thread as the only bright red.
G. **Hero label placement:** the codename must never sit on the face. Put it in the bottom margin of the poster; for 武器大师 use Noto Serif SC 600 (no brush fonts, no seals).
H. **Camera continuity:** the entry page's wall is cropped by `cover` and has parallax; do your best to make the hub's wall look like the camera moved closer to the same place (zoom into the upper centre, same lamp positions), without touching scene.js.

## Process (you drive this loop yourself)

1. Build round A: static composition at 4 viewports (1600x900, 1280x800, 1024x768, 390x844) with all three heroes and the unlocked state. Screenshot each into `gen/r6/shots/` as `A-<viewport>-<luna|hound|smith|unlocked>.png` (headless Chrome, `index.html?hub=1&still=1&sel=N&c=luna[&unlocked=1]`). Look at them. Fix what is wrong. Repeat until composition is solid.
2. Build round B: motion, interactions, easter eggs, reduced-motion, state model. Test what you can in headless Chrome (take frames at a few `--virtual-time-budget` values, or call functions); for what you cannot see, reason carefully.
3. Final self-review against the quality bar: write `gen/r6/gpt-report-2.md` (max 80 lines): what you built, what you deliberately did differently from my brief and why, known weaknesses, and a list of the screenshots (paths) that best show the result. Also note anything you want me to regenerate or change.
4. Cap yourself at 3 improvement iterations after the first full build. Finish with a 10-line terminal summary.
