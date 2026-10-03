# ROUND 1 — Opinion: the wall is the interface

The current hub is a competent character-selection screen, but it is not yet an award-calibre continuation of this story. Its strongest ingredients are the characters, the paper file and the red thread. Its weakest decision is replacing a specific room with a generic layout. I would rebuild the composition around an illuminated patch of the same wall, with one large pasted portrait, two smaller suspect posters and a readable file. The visitor should feel that they have approached evidence somebody has already arranged for them.

This is an opinion only. I read `v2/index.html` (including `.tag` and `.v-b`), `hub.css`, `hub.js`, `sfx.js`, and the relevant scene/rope/layout code in `scene.js`; I reviewed the three supplied screenshots and the actual wall and four poster assets. No implementation is proposed as a completed change here. The client's Awwwards / Webby / FWA bar means judging hierarchy, space, typography, palette, motion, interaction, responsiveness and originality together, not counting visual effects.

## 1. Honest critique — eight problems, ranked

1. **The room disappears at the precise moment it should become more convincing.** `.hub` is almost-black with a regular dot gradient; the entry's graffiti, lamp position, wall joints and light burst vanish. The result reads as another game menu. Restoring the wall is the first structural change, not a decorative final pass. The supplied entry screenshot is extremely dark; I can identify the composition but would not use that frame's luminance as an exposure target. The source wall and approved scene establish the spatial reference.

2. **Portrait is visibly broken, and the overflow conceals navigation.** At 390×844 the file runs beyond the right edge, EXAMINED is clipped and 武器大师 is partly off-screen. BACK is absent from the supplied phone frame. The thread traverses the file's reading area. `overflow:hidden` prevents recovery; the absolute `vh/vw` composition has no content-aware fit. Fixing one width will not solve this. Also, `index.html` already applies universal `border-box`, so I would not blame missing box sizing without reproducing the geometry.

3. **The hierarchy sells LUNA twice and demotes the detective's actual evidence.** A huge pale panel, oversized LUNA tag and three wide portrait cards spend most of the viewport repeating faces. The note is tiny and peripheral. Desktop has unused pale space within the hero, while usable dark space is scattered around it. The selected suspect needs one dominant image; the file must be the second reading destination; alternate suspects should be clearly third.

4. **The typography and material language disagree with the entry.** Ransom-note SUSPECTS, gigantic condensed name, outlined number, skewed manga cards and heavyweight EXAMINED compete as separate devices. The title is implemented letter by letter with four unrelated styles. BACK is a simple pale parallelogram rather than the approved B face/slab construction. None of these devices is inherently bad; together they prevent a coherent voice. The small Chinese note has less typographic authority than the decorative English stamp.

5. **The red thread behaves like an illuminated diagram, not physical evidence.** Bright white-ringed pins, broad curves and persistent glow make it a second headline. In the mobile frame it crosses the name and note. The active Bézier's control point is placed below the lower endpoint, producing an exaggerated droop. Each branch should have a plausible fastening point, slight gravity and a dark contact shadow; no line should run across information. The topology currently communicates “a connected list” more than a disturbing common origin.

6. **The moving parts are individually enthusiastic and collectively incoherent.** The portrait slides, the name bounces, the paper stamp slams and the file elastically rocks. There is no selected-poster peel/paste event. `select()` animates `heroName` rotation to zero, overriding its CSS angle; other CSS and GSAP transforms similarly share ownership. The file uses GSAP selection animation and Draggable on the same object. These conflicts undermine physical consistency. Reduced motion still retains the outgoing portrait tween, slot/title entrance, active pointer handler and file release elasticity in parts of the implementation.

7. **The investigation does not yet have a reliable state model.** `seen` is updated at the start of selection; it never triggers a fourth slot. Rapid switching can leave timeline callbacks that are not owned by the latest request: killing some element tweens is not cancellation of the whole selection transaction. Invalid public `select(i)` can access an undefined suspect. EXAMINED can arrive while the final NOTE redaction is still retracting. A visit should become examined only after its readable reveal completes; delayed work must not mutate a newer selection.

8. **The polish is expensive in the wrong places.** Five chained drop shadows outline the large cut-out, while large paper areas repeat grain, halftone and conic bursts. `gsap.ticker.add(layout)` measures every slot and the file pin and rewrites SVG geometry continuously, including at rest. The entry's own ticker also keeps running after `main` is hidden. Neither proves a measured frame-rate failure, but both are avoidable costs to audit. The file stamp's negative offsets and oversized animated footprint are unsafe around the note. A restrained finish with clean reading geometry would feel more premium than more filters.

## 2. Where I disagree with the art direction

**I agree with the same wall, B-style controls, warm monochrome, restrained red and a delayed unknown. I disagree with treating all existing posters as ready-to-use hero art.** Inspect the assets: LUNA explicitly says “NOT A TARGET / I FOLLOW THE THREAD”; HOUND says “Who are you hiding from?” and has a large TRACE headline. These tell the audience how to read the mystery. LUNA has a script signature, HOUND has another typographic system, and Smith's poster identifies him primarily as DORMANT rather than 武器大师. Enlarging them makes those inconsistencies louder. They were background ephemera in the entry; in the hub they become editorial statements.

I would retain their torn-paper character and faces, but make the hub's hero a cleaner paper/cut-out composition using `luna.webp`, `hound.webp`, `smith.webp` and live labels, or use cleaner generated variants. Leave the approved entry posters alone. Do not cover baked text with conspicuous extra strips merely to salvage the assets: that adds more visual competition. If new art is unavailable, compose the hero from existing cut-outs; the redesign can proceed.

**I disagree with applying the full B treatment to every static label.** It makes the whole room a control panel and spends red everywhere. Use the complete -14° black face / offset warm-grey slab / hover inversion for BACK and interactive file-index controls; use a quieter matching black bar for SUSPECTS and a shallow status tag. Static tags have no hover behavior. Paper stays paper; text on the dossier stays typographic. One red triangle in the active control is enough, rather than triangles in every row.

**I disagree with perpetually swaying an entire taped poster and shaking the entire wall after every click.** A solid wall does not wobble because a sheet is pasted. Let the poster wrapper take a 1–2 px impact recoil while the camera/background stays stable. Idle motion belongs to a loose paper corner, dust and light, with a nearly imperceptible common breeze. A poster pinned at two points should barely move. Reserve a single anomalous light interruption for the ghost.

**I disagree with an electrically glowing thread and continuous ghost glitches.** Keep the thread saturated but mostly unlit; the wall lamp should make it legible. The ghost needs a short local misregistration, then a persistent readable/selectable presence with infrequent, low-amplitude signal changes. An endless noisy silhouette is a cyberpunk cliché and an attention drain. No full-screen flash, RGB split or new hue.

**I would demote EXAMINED.** Preserve the word if it is useful, but put a small ink impression in a reserved footer, not a theatrical floating sign. The note is the point of the file. The stamp must never cover it, even while growing during an animation; animate opacity and a maximum 1.06 scale inside its own area.

**I would constrain file dragging instead of offering unlimited throwing.** Desktop gets a grip on the blank top margin and bounded movement within its evidence area; the thread follows. Portrait gets a short deliberate corner lift, with normal vertical scrolling if needed. Dragging must not swallow selection, reading or swipe gestures. The global `touch-action:none` in `index.html` needs a hub-scoped override for that to work.

**A crop of the same wall is necessary but not sufficient for a literal camera walk.** The approved entry also has runtime pasted panels. I would reuse a small number of visible edge fragments from those assets, at positions consistent with the crop, rather than invent a new collage or rebuild all 22 panels. With `scene.js` protected, exact preservation of its randomized offsets and parallax is a limitation, not something I would promise. Share fixed architectural landmarks first.

## 3. Concrete redesign

### Desktop 1600×900

Working title: **a prepared evidence wall**. Clear asymmetric balance: hero left, reading area right, quiet wall between. The initial hero follows `window.Scene.who` when present, so the character whose thread led us here remains the first subject. Direct `?hub=1` defaults to LUNA; explicit `sel` wins. Treat codenames and numbers as live text. Preserve 武器大师 exactly, with Noto Serif SC 600, not faux Chinese display lettering.

Coordinates below are viewport percentages; x/y identify the unrotated wrapper's upper-left corner. Poster dimensions are maximum boxes: contain the full art at its native aspect ratio, without stretching. Allow 12 px around rotation/tape/shadow bounds.

| Element | x / y | Maximum width / height | Treatment and role |
|---|---|---|---|
| SUSPECTS title | 4% / 4% | 19% / 6% | One black bar, Anton 32–40 px; modest grey offset. Secondary to the portrait. |
| Selected poster | 12% / 15% | 31% / 70% | Approx. 496×626 px for LUNA; -2° fixed angle, two small tape pieces, tight contact shadow. Primary hero. |
| Selected codename | within poster's lower margin | 85% of poster width / content height | Anton 44–56 px, or Chinese serif 32–40 px; no second giant name floating outside it. |
| Alternate poster A | 53% / 15% | 10.5% / 25% | Approx. 168×212 px; +2.5°, live small number/name tab. |
| Alternate poster B | 68% / 19% | 9.5% / 23% | Approx. 152×192 px; -3°, unequal heights, same material system. |
| Dossier | 50% / 46% | 27% / content height, target 31% | Approx. 432×260–280 px; +1°, 20 px padding, one clear grip, reserved footer. Second focal point. |
| File index | 50% / 82% | 27% / 5% | Three compact B buttons: 01, 02, 03; stable order and active state. Names available accessibly. |
| BACK | 4% / 90% | 8% / 5% | Smaller version of approved B control, 44 px minimum hit height. |
| Ghost, after unlock only | 81% / 49% | 11% / 26% | Smaller dark sheet, redacted name, 04; no initial placeholder or fourth index button. |

The hero plus the two alternates show all three known people without a duplicate selected thumbnail. When a suspect changes, the clicked small poster becomes the hero and the former hero takes its small location; the numbered file index remains spatially stable and supplies predictable keyboard navigation. Sizes/angles belong to locations, not identities. Small posters are still buttons with accessible names. After unlock, add 04 to the index without shifting the hero or the file.

Use Anton only for title/codenames; Space Mono 11–12 px for short system labels, 13–14 px for values; Chinese note 17–18 px with 1.65 line-height. At 1024 px the note may become 16 px, never screenshot-sized 11 px. Status is a compact monochrome tag. A thin rule separates the note; a 28–32 px footer holds the small EXAMINED mark. Dossier height is driven by actual copy, not a hard crop.

**Wall and light:** retain `s-plate-k.jpg` in its 1672×941 coordinate space. Apply cover, then an additional 1.08× zoom around the central upper wall (roughly plate x=836, y=340). With a centred 16:9 cover this keeps the right lamp near the upper-right edge and the baseboard low in frame; verify the actual mapped coordinates. Keep the lamp, burst and wall texture in the same transformed group so the glow cannot drift off its fixture. Do not add a second fake floor or conic burst.

Use a static translucent black veil, initially around 25–35%, adjusted visually so architectural details remain recognisable and the paper stays readable. Darken exposed wall more than the paper. Preserve warm-neutral whites; no pure-white giant panels. Two or three cropped storyboard scraps can live at the outer edges, low contrast and noninteractive. Keep roughly a third of the composition as visible wall; empty wall is a pacing device, not missing content.

Fine-pointer parallax: wall group at most ±3 px, poster material group ±5 px, dust ±7 px, smoothed over 0.6–0.9 s. Title, file text and index remain steady. All fastened thread anchors share the relevant moving wrapper; dust is the only independent foreground plane. No sensor/device-tilt requirement on mobile.

**Thread:** one quiet chain between the three portrait pins, with the selected pin branching to the file's top-left pin. Route through the open wall corridor, never across a face, name or note. Retain a short loose tail toward the right margin. On unlock that tail acquires the fourth fastening point: a relation discovered late, not a visible initial fourth slot. Use 1.5–2 px red core, subtle dark under-stroke, small nonluminous pins. The common junction hints at a shared source without identifying the mastermind.

### 1280×800 and 1024×768

Use a near-square composition when aspect ratio is below about 1.45, not only a width breakpoint: hero x=7%, y=19%, max w=35%, h=67%; alternates x=51% and 72%, y=14–17%, max w=12%, h=23%; dossier x=49%, y=44%, w=41%, content height around 35%; index x=49%, y=83%. Ghost enters the alternates' group by reducing them to a three-column row only after unlock, rather than squeezing beside the file. Cap their width by height as well as available space.

At 1280×800 retain the wider composition where it fits, increasing the dossier to about 31% width and moving its x to 49%. Fit decisions use the file's measured content and reserved margin, not aspect ratio alone. If increased text size makes the paper too tall, enable vertical hub scrolling; never shrink the note to preserve a screenshot composition.

### Portrait 390×844

Use a deliberately composed single-column scene with a central poster stack and a stable numbered index. **No horizontally overflowing row and no full-page drag capture.** Reference geometry at default text size:

| Element | Reference bounds | Rule |
|---|---|---|
| Header/title and BACK | y≈20–64 px; x≥20 px | Safe-area-aware; BACK has a 44×44 px minimum target. Title 24–28 px. |
| Poster stage | y≈84–408 px; centred | Selected art max 248×313 px, full torn outline visible. Two paper edges behind it, offset only 6–10 px. |
| Numbered index | y≈420–466 px | Three equal buttons inside x=20–370 px; four equal buttons after unlock. All ≥44 px high. |
| Dossier | x≈22–368 px; y≈486 px | 346 px unrotated width, 16 px padding, ≤0.6° angle. Natural height about 260–285 px including footer. |
| Bottom breathing room | to y≈804 px | Reserve safe-area and shadow bounds; no content under a fixed overlay. |

Use grid/flow gaps to realise those references; do not independently absolutely position every row. Stage height is bounded by `dvh` and available width. At shorter heights or 200% text, the hub scrolls vertically with its wall background fixed; all reading content remains reachable. Override inherited touch rules inside the hub. Swipe the poster stage horizontally to change known suspects; leave vertical gestures to the page. The index is the equally capable tap/keyboard fallback.

The file cannot be flung off-screen on portrait. A small corner-lift gesture gives paper tactility and the optional underside detail. The red thread uses the left/right gutters and enters at the file's blank upper margin. It never crosses the index labels or text. The ghost becomes an available fourth sheet in the stack and index; show a brief dark offset edge plus 04 so its arrival is discoverable without moving the file.

For portrait the wall's cover crop is centred near the central light burst; the side lamps may honestly fall outside frame. Do not relocate a fixture merely to force it into the phone. Continue the same mapped ambient light, grain and sparse dust.

**Z-order within hub:** 0 wall; 1 registered light/veil; 2 edge scraps; 3 paper contact shadows; 4 poster materials; 5 dossier; 6 thread core; 7 tape/pins and controls; 8 lifted corner/dragged paper; 9 restrained dust with `pointer-events:none`. Thread routes avoid all text regardless of stacking. Keep hub at the existing document z=35, entry tear halves at 40, slash at 50. This respects the already-approved overlap during transition.

## 4. Motion choreography

Times are seconds relative to `openHub()` for entry, the selection action for switching, and completion of the third distinct examined file for the ghost. The existing tear starts the hub at about 0.42 s into its own animation; do not start a second tear or flash. Reveal is complete within 1.5 s, with readable text receiving no continuous motion.

### Enter hub

| Time | Element | Motion | Easing |
|---|---|---|---|
| 0.00–0.35 | Wall/light | Already visible behind departing halves; camera crop settles from 1.00 to 1.08 zoom, ≤12 px translation. | `power2.out` |
| 0.14–0.38 | Title | Black bar seats by 6 px; opacity 0→1. No letter-by-letter bounce. | `power3.out` |
| 0.25–0.56 | Selected poster | Scale 1.04→1, y -12→0, rotation within 1° of resting angle; shadow tightens at contact. | `power3.out`; 60 ms contact settle |
| 0.39–0.74 | Two alternate posters | Arrive 80 ms apart, 8 px travel and 2° rotation; tape appears at contact. | `power2.out` |
| 0.58–0.82 | Dossier | Seats by 8 px with 1° turn; fields remain covered until placement finishes. | `power3.out` |
| 0.65–1.03 | Thread/pins | Reveal only relevant segments along actual pin routes; one shallow settling wave. | `power2.out` |
| 0.70–0.94 | Index/BACK | Small opacity/4 px seating transition; controls usable on appearance. | `power2.out` |
| 0.84–1.34 | File values | CODENAME, ROLE, MODIFIED, NOTE redactions retract, 90 ms stagger, 230 ms each. | `power3.inOut` |
| 1.35–1.47 | File footer | Small EXAMINED ink impression fades in; commit examined state after reveal. | `power1.out` |

One low `SFX.snap(.10)` at selected-poster contact after an actual user gesture; the entry already supplied the thud/whoosh. Do not add three more paste sounds on entry. Direct dev entry must not attempt autoplay audio. On completion start sparse dust and a ≤0.15° loose-corner breeze, not whole-sheet oscillation.

### Switch suspect

| Time | Element | Motion | Easing |
|---|---|---|---|
| 0.00–0.08 | Index/file | Commit active intent; cover outgoing values rapidly without collapsing rows. | `power2.in` |
| 0.00–0.16 | Old hero | Peel approximation from upper tape edge: ≤5° tilt, 12 px lift, loosening shadow, fade; no expensive page mesh. | `power2.in` |
| 0.10–0.34 | New hero | Decoded art seats at hero location, scale 1.045→1, rotation overshoot ≤1.2°. | `power3.out` |
| 0.24–0.40 | Former hero's small location | Replaced small poster seats by 5 px; hero contact gets 1 px local recoil. | `power2.out` |
| 0.24–0.50 | Thread | Active branch retensions to new pin with one damped 2–3 px deflection. | `sine.out` |
| 0.30–0.80 | File values | Live text swaps under bars; four bars retract with 80 ms stagger. | `power3.inOut` |
| 0.82–0.94 | Footer/state | Small mark appears for first completed read; commit examined set. Revisited files reveal faster. | `power1.out` |

Use one quiet snap at new-poster contact; no automatic thud. No-op selections produce no sound. Latest selection wins: cancel the owned timeline, settle outgoing layers and guard every delayed callback with a selection token. Do not wait for a previous animation to unlock navigation. Reserve file height against the longest known note to avoid a jump. MODIFIED is sampled as selection-open time minus exactly three seconds, then held; it is not a ticking clock. Keep the selection's OPENED time internally for the clue.

### Reveal fourth slot

| Time | Element | Motion | Easing |
|---|---|---|---|
| 0.00–0.35 | Existing composition | A short quiet pause after the third file is readable. Nothing changes place yet. | — |
| 0.35–0.45 | Right lamp / ambient patch | One modest 10–15% dip, local and no white flash. | `sine.inOut` |
| 0.42–0.68 | Ghost paper | Two greyscale misregistration offsets, ≤3 px, followed by opacity to a readable dark silhouette. | stepped, then `power1.out` |
| 0.55–0.88 | Loose thread / 04 index | Tail finds the ghost pin; fourth control seats. Portrait stack receives a dark paper edge. | `power2.out` |
| 0.88–1.15 | Name/signal | Redacted name remains covered; tiny monochrome signal bars stabilise weakly. | discrete state change |

The ghost remains present after this event. Later signal variation is local, sparse (at least several seconds apart) and not a replay of the full reveal. Activate `window.BB.onGhost()` if defined; otherwise give a 200 ms local displacement and `NO SIGNAL` in a reserved system-label space, then restore a usable button. Preserve any externally supplied `onGhost` when exporting BB. No finale, dark room or identity revelation this round.

**Reduced motion:** render final wall crop, no parallax/sway/drag inertia/peel/shake/flicker. Use ≤100 ms opacity changes, reveal text immediately in reading order, and expose 04 after the same completed-examination condition. Represent weak signal statically; ghost activation still returns `NO SIGNAL`. Listen to preference changes, not just the initial media-query result.

## 5. Micro-interactions and three easter eggs

- Fine-pointer hover lifts only a small poster's loose bottom edge by 2 px; tape stays fixed. Press seats it. B buttons use the existing warm-paper face / dark-red slab inversion over 120–160 ms; focus has an equally visible monochrome edge. No hover-triggered sound.
- Arrow keys step through the stable 01→02→03 order and include 04 only after unlock; clamp at ends. Scope handlers to the open hub, skip editable targets and modifier chords. Keep `aria-pressed`, visible focus and selection consistent; Enter/Space activates 04. Swipes use a distance/axis threshold and have identical index-button alternatives.
- Desktop file dragging begins only from its grip, uses cached bounds and cannot obscure BACK or the complete index. Recalculate thread only during movement/settling. A keyboard-accessible corner detail provides the same underside discovery; text remains selectable outside the grip. Announce the newly available 04 once with a short polite system message, not the whole dossier on every animation frame.

1. **Three seconds, every time.** Activating the MODIFIED value, by click or keyboard, briefly shows a second small system line, `OPENED hh:mm:ss`, in space reserved beside/below it. Every file has the same three-second difference, including a revisit much later. No red highlight, tooltip explaining a honeypot or “suspicious” caption. Selection captures both values together, avoiding a one-second drift.
2. **The same scar.** Lift the file's lower corner and find the same faint two-staple puncture pattern beneath every suspect's paper. It is a tiny reused texture, not another sentence. Ordinary viewers see wear; careful viewers notice exact repetition. On touch/keyboard, a small corner control toggles the lift so dragging is never mandatory.
3. **The loose end.** Before unlock, clicking the visible thread tail's small physical pin (with an equivalent focusable hit target) gives one restrained tug and immediately returns to slack, with no message. After the ghost appears, the same tail is fastened to 04. The previously incidental object becomes part of the relationship. No extra hidden member appears early.

These are optional discoveries, not steps required to unlock 04. Avoid piling on WATCHING/YOU/HONEYPOT copy. The unlock depends only on the three completed known dossiers, including the initial hero once revealed. Repeated visits to one file cannot advance it; interrupted reveals do not count.

## 6. Risks and things I need from the art director

**No new asset blocks layout work.** Existing cut-outs support a cleaner composed poster, tape already exists, and the wall is sufficient. The meaningful decisions are whether to replace the hub poster lettering, whether the small EXAMINED footer is acceptable, and whether the three current Chinese notes are final. My defaults are cleaner hub art, a small footer mark and unchanged notes. The LUNA “three days” observation usefully contrasts with the file's three-second metadata; do not explain that contrast.

The three heroes have different crop proportions. Judge faces and full paper outlines, not equal image widths. Existing posters are 620 px wide; a roughly 500 px CSS hero is acceptable for a first pass but can soften at 2× device pixel ratio. Prefer 1400–1600 px replacements with alpha if we generate new hero assets. Avoid scaling the existing 1672 px wall aggressively beyond the proposed 1.08× crop on high-DPI displays.

Optional generated assets, exact prompts below. Typography and factual content will be live HTML; generated images must contain no writing. Use existing character art as visual reference and preserve identity. These are hub variants only; do not overwrite approved entry assets.

- **`hub-poster-luna-clean.webp`:** “Using the supplied LUNA character reference, preserve her exact face, straight black hair, red crescent hair ornament and black belted coat. Create a physically photographed torn-paper evidence poster, portrait aspect ratio 4:5, isolated on a transparent background, minimum 1400 pixels wide. Black and grey manga ink on subdued warm-grey aged paper. One clear dominant portrait, head and upper torso, generous quiet paper margin at the bottom for a live codename label. Irregular fine torn fibres and subtle creases, no exaggerated thick white border. No words, letters, numbers, signatures, quotes, barcode, tape, pins or thread. No glow. The crescent ornament is the only small red accent. Keep all paper and hair inside the canvas.”
- **`hub-poster-hound-clean.webp`:** “Using the supplied HOUND character reference, preserve his exact face, dark hair, floppy-eared hood and headphones. Create a physically photographed torn-paper evidence poster matching the supplied clean LUNA poster's paper tone, edge fibres and printing scale, portrait aspect ratio 4:5, isolated on transparent background, minimum 1400 pixels wide. One dominant head-and-upper-torso manga portrait in black and grey on subdued warm-grey paper, quiet bottom margin for a live label. Retain only the tiny red headphone ring. No duplicate face montage, words, letters, numbers, quotes, signatures, barcode, tape, pins or thread. No glow. Keep the complete paper outline inside the canvas.”
- **`hub-poster-smith-clean.webp`:** “Using the supplied 武器大师 character reference, preserve his exact face, swept dark hair, black jacket and weapon straps. Create a physically photographed torn-paper evidence poster matching the supplied clean LUNA poster's paper tone, edge fibres and printing scale, portrait aspect ratio 4:5, isolated on transparent background, minimum 1400 pixels wide. One dominant head-and-upper-torso black-and-grey manga portrait on subdued warm-grey paper, quiet bottom margin for a live label. No words, letters, numbers, newspaper text, DORMANT headline, calligraphy, seal stamp, quotes, barcode, tape, pins or thread. No colour accent and no glow. Keep the complete paper outline inside the canvas.”
- **`hub-poster-ghost-clean.webp`:** “Create a torn-paper evidence poster matching the supplied clean suspect posters, portrait aspect ratio 4:5, isolated on transparent background, minimum 1400 pixels wide. Mostly charcoal ink with a barely discernible anonymous human silhouette lost in worn halftone printing, a small empty warm-grey lower margin for a live redacted label, fine irregular paper fibres. No identifiable face, giant question mark, words, letters, numbers, barcode, symbols, tape, pins, red thread, coloured glow or RGB glitch. Keep the complete paper outline inside the canvas. The image should remain unsettling when perfectly still.”

The current unknown asset's giant question mark is too explanatory for a prominent reveal; use it provisionally only as a subdued small sheet. Glitch is implemented locally in motion, not baked into an unreadable image. Do not ask for a new wall until the existing one has been composition-tested.

**Protected entry risk:** its hidden ticker/listeners remain active, and BACK currently reloads into that scene. I would first measure the hub with the entry running, reuse existing layers where practical and keep hub work efficient. If measured performance still requires a `Scene.pause()` interface, that needs a later explicit scope decision because `scene.js` is protected. Do not silently change it. Entry static/random pasted offsets also limit exact camera continuity; preserve wall landmarks and consistent exposure within this scope.

## 7. Implementation plan for a later authorised build round

1. **Rebuild only the hub section in `v2/index.html`.** Introduce location, motion and paper-material wrappers; stable numbered navigation; content-driven dossier with a reserved footer; corner/grip controls. Reuse B tokens through hub-scoped styles. Add hub-scoped touch/scroll behavior. Leave entry markup, its approved style rules and tear logic untouched; leave `scene.js` unchanged.
2. **Replace `v2/hub.css` deliberately.** Solve static desktop and portrait composition first, using existing assets. Each GSAP motion wrapper owns its transform; fixed CSS angle/skew and hover lift belong to separate nested wrappers. Verify all three heroes and the longest note before adding animation. Add optional new assets under `v2/assets/` only if supplied.
3. **Rebuild `v2/hub.js` around selection and examined state.** Preserve `BB.openHub`, `BB.select`, external `BB.onGhost` and dev switches. Validate indices; decode images before swaps; make timelines cancellable; commit examination after reveal; unlock ghost once. Handle image failure without leaving covered text. Use session state for examination unless persistent progress is separately requested.
4. **Add motion, bounded interaction and sound.** GSAP/Draggable/Inertia already exist; no network dependencies. Use SVG paths with cached pin coordinates: measure on resize/image load and invalidation, update while animated/dragged, stop at rest. Do not pair CSS transforms with GSAP on one element. Use tiny shadow elements rather than animating large blur filters. Audit the protected entry's ongoing cost before promising 60 fps.
5. **Self-test with screenshots at 1600×900, 1280×800, 1024×768 and 390×844.** For each size capture LUNA, HOUND, 武器大师 and unlocked ghost; compare hero dominance, wall continuity, note readability, complete torn outlines, footer clearance and every control's bounds. Use `?hub=1&still=1&c=luna&sel=0|1|2` for deterministic settled states and a deterministic dev-only way to reproduce the unlocked state.
6. **Verify real behavior separately from stills.** Exercise the approved ENTER tear with all three entry characters; record entry, switching and ghost frames at their contact/reveal times. Test rapid alternation, interrupted third-file reveal, resize/orientation after dragging, touch swipe vs vertical scroll, arrows/focus, reduced motion, 200% text, missing image and callback-present/callback-absent ghost clicks. Check no horizontal document overflow, no inaccessible controls and no note/stamp intersection at rest or in motion. Profile animation with the entry still active; screenshots alone cannot validate 60 fps or gesture ownership.

The rebuild succeeds when the room survives the transition, one suspect draws the eye, the Chinese evidence is effortless to read, and the fourth presence feels discovered. More collage, larger stamps and louder glitch will not substitute for those outcomes.
