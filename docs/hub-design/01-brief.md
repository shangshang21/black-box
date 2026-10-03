# Brief for GPT: redesign the "SUSPECTS" hub page (round 1: OPINION ONLY, do not edit any file yet)

You are the **builder and co-art-director**. I (Claude) am the art director and reviewer. The client (a solo developer) wants the result to look like an award-winning website and said: tell each other bluntly what is wrong; rebuilding the layout from scratch is allowed.

## The quality bar (copied verbatim from the client, keep it as the standard for every round)

以 Awwwards、Webby Awards、FWA 获奖网站为质量标准。完成后，从排版、留白、视觉层级、色彩、动效、微交互、响应式和原创性等方面自检并持续优化，直到页面没有明显可提升之处。

## The project in one paragraph

A story-driven web game (front end only, no backend). The visitor is a detective who has hacked into a secret syndicate's system. Three known members are shown as suspects (LUNA the executor, HOUND the sniffer, 武器大师 the weaponsmith, who is dormant). A fourth member is unknown. The whole site is secretly a honeypot: everything the detective finds was prepared for them; the final reveal is that the mastermind was watching. Core principle from the client: **say little, let the visitor discover anomalies**. Languages: the SYSTEM speaks English (UPPERCASE mono labels, texture), the DETECTIVE's notes are Chinese (real content), codenames are never translated.

## What exists (read these files, all under `v2/`)

- `index.html`: the entry page (already finished and approved, do not redesign it). It has a dark graffiti wall, one of the three members standing in front (random per visit), four small torn-paper posters and ~22 storyboard panels pasted on the wall, slanted black "B-style" UI tags (ACCESS GRANTED / CRACKING), a slanted ENTER key, and a red thread (verlet rope) held in the character's hand. Clicking ENTER tears the screen along the thread and calls `window.BB.openHub()`. The hub markup is `<section id="hub">` inside this file. The CSS for the B-style UI is in the `<style>` block (`.tag`, `.v-b`, `.tri`, `.bar`, `.meta`).
- `scene.js`: entry scene logic. Do not edit.
- `hub.css`, `hub.js`: the CURRENT hub (the thing to redesign). `hub.js` exposes `window.BB = { openHub, select }`.
- `sfx.js`: `window.SFX.snap(vol)`, `.thud(vol)`, `.whoosh(vol)` (synthesized, only audible after a click).
- `assets/`: `s-plate-k.jpg` (1672x941 graffiti wall with a clear baseboard and glossy floor; the lamp bulbs are at about (1522,92) and (174,24) in plate pixels; a halftone light burst is at top centre), `s-plate-{d..j,l}.jpg` (alternative walls), `poster-luna|hound|smith|unknown.webp` (620px wide torn-paper posters, transparent background, ~4:5), `luna.webp hound.webp smith.webp` (bust cut-outs, transparent), `pnl-00..29.webp` (30 small storyboard panels, transparent, white torn frames, no text), `stk-tape.webp stk-evidence.webp stk-barcode.webp stk-bar.webp stk-curl.webp` (stickers/tape), `s-{luna,hound,smith}-char.webp` (full-body cut-outs).
- Libraries already loaded on the page (global): GSAP 3.15 (`gsap`, `Draggable`, `InertiaPlugin`). No build step, no npm, vanilla JS only. Do not add new network dependencies.
- Screenshots of the current state (look at them): `gen/r6/cur-hub-16x9.png`, `gen/r6/cur-hub-phone.png`, `gen/r6/cur-entry-16x9.png`.
- Dev switches: open `http://localhost:3200/v2/index.html?hub=1&still=1&c=luna` to show the hub directly with all short animations fast-forwarded (`&sel=1|2` selects another suspect; `?c=` picks the entry character). The server is already running on port 3200 and sends no-cache headers. You can screenshot with headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,900 --virtual-time-budget=8000 --screenshot=OUT.png "URL"`.

## Art direction (my opinion; challenge it where you think you can do better)

1. **Same world as the entry.** The hub must feel like the camera walked closer to the SAME graffiti wall, not like a different page. Use `s-plate-k.jpg` (or a crop/zoom of it) as the background with the same lamp glow / light burst / grain / dust feeling.
2. **Members as torn-paper posters, not cropped busts.** The hero is the selected member's poster (use `poster-*.webp`, or compose a bigger hero from `luna.webp` etc. if the poster is too small), pasted on the wall with tape, slightly rotated, with a soft paper shadow. The other members are smaller pasted posters or thumbnails on the wall. Selecting one should feel like a **slap**: the old one peels away, the new one is pasted with a quick scale/rotate/shadow-tighten and a tiny wall shake.
3. **UI language = "B-style":** slanted black bars (skewX -14deg) sitting on an offset warm-grey paper slab (`#d3cfc3→#9d998d` with grain), white/paper text, a small red ▶ marker, one thin red slash. On hover the face turns warm paper and the slab turns dark red (`#b30c1c→#6e0511`). Use it for the title, BACK button, status tags and any list. Re-read the `.v-b` and `.tag` CSS and reuse the same tokens. The client previously found pure white + saturated red "loud/tacky": keep contrast moderate, keep red rare.
4. **Palette:** black / white / warm grey. Red (#e5071a family) is almost exclusively for the **red thread** and tiny markers. No other hues.
5. **Typography:** Anton (display, uppercase), Space Mono (system labels), Noto Serif SC 600 (the Chinese detective note). Do NOT use Chinese brush-calligraphy titles or red seal stamps (client: "土", tacky). Keep text minimal.
6. **The dossier:** a pinned, slightly crooked paper case file with tape (draggable via GSAP Draggable + Inertia is fine and was liked): FILE no., status tag, CODENAME, ROLE, MODIFIED (always now minus 3 seconds, it is a honeypot clue), and the Chinese NOTE. Fields start covered by black redaction bars that retract one by one when a suspect is opened. **Bugs in the current build you must fix:** the EXAMINED stamp covers the NOTE text on desktop; on a 390px phone the dossier overflows the right edge.
7. **The red thread** connects the posters/pins together and to the dossier (SVG, can be a simple drawn path or a small rope simulation; the entry page already has a verlet rope in `scene.js`, you may read it for the technique). It is the one saturated element, so it carries meaning: "everything points to one person".
8. **The 4th, unknown slot:** it should NOT be visible at first. After the visitor has opened all three suspects, a fourth poster appears as an unstable ghost (glitching silhouette poster, name redacted, signal strength flicker). Clicking it for now calls `window.BB.onGhost && window.BB.onGhost()` if defined, otherwise plays a short "signal lost" glitch and a system line like `NO SIGNAL`. (A dark-room finale will be built later; do not build it now.) It is OK to also use `assets/poster-unknown.webp`.
9. **Motion choreography:** the page is entered from a tear transition (the entry page splits along the thread and slides away to reveal the hub). Design the first 1.5 seconds: what gets pasted when, in what order, with what easing; then idle behaviour (tiny sway of pasted things like the entry page, lamp flicker, dust); then selection change; then hover/press micro-interactions; keyboard arrows must work; `prefers-reduced-motion` gets a calm fallback. Use sound sparingly via `window.SFX`.
10. **Responsive:** must be excellent at 1600x900 (16:9), 1280x800 and 1024x768 (4:3-ish), and 390x844 phone portrait (touch, no horizontal scroll, nothing clipped). You are free to use a completely different layout on portrait (e.g. swipeable poster stack).
11. **Performance and robustness:** 60 fps on a normal laptop, avoid heavy CSS filters on large areas, no layout thrash; do not use `transform`/`translate`/`scale` CSS on elements that GSAP animates (GSAP overwrites them), use wrapper elements.

## Your task in this round (no file edits!)

Write your answer to `gen/r6/gpt-opinion-1.md`. Be concrete and opinionated. Structure:

1. **Honest critique** of the current hub (look at the screenshots and read the code): top 8 problems, ranked.
2. **Where my art direction above is weak or wrong**, and what you would do instead (be bold; "I disagree because..." is welcome).
3. **Your concrete redesign**: desktop 16:9 layout with element positions/sizes as percentages of the viewport; portrait layout; z-order; what is hero, what is secondary; how the wall background is used (zoom/crop/parallax).
4. **Motion timeline** (table: time, element, motion, easing) for entering the hub, for switching suspects, for the ghost slot reveal.
5. **Micro-interactions and 3 easter eggs** that fit "say little, let the visitor discover".
6. **Risks / things you need from me** (new image assets you would like generated, copy you want written, decisions you need). List any assets as exact prompts so I can generate them.
7. A short **implementation plan** (files to touch, order of work, how you will self-test with screenshots at 4 viewport sizes).

Keep the file under ~250 lines. When finished, print a 10-line summary in the terminal.
