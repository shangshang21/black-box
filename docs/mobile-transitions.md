# Mobile act transitions

The entry wall uses `overflow: clip` so focusing ENTER cannot scroll the clipped
scene to a descendant. `overflow: hidden` allowed a 378 px internal scroll during
the hand-off even though the page itself did not scroll.

Touch entry keeps one wall, tightens its red thread and fades the prepared hub
over it in 420 ms. It does not clone two full walls or add a white flash. The
thread hint and hover/focus effects cannot overwrite an active entry pull.
Desktop entry retains its two-half tear after the hub's images are ready.

The hub warms the finale after the first character settles. Finale loading waits
for both CSS and JavaScript. Images, the hidden section and its initial canvas
are prepared before reveal. The room then fades over the hub in 320 ms without
the former 140 ms transparent-canvas cut. An unchanged viewport reuses the canvas
allocation. Failed loading leaves the hub available for retry.

The silhouette scan checks neighboring pixels only when a pixel could extend a
bounding edge. Its bounds match the original scan; production images load first,
with the existing fallback used if production art is missing.

Regression commands (install Playwright or set `PLAYWRIGHT_MODULE_PATH`):

```sh
QA_ASSERT_FIXED=1 node tools/qa-transitions.cjs /tmp/transition-evidence
node tools/qa-mobile-visual.cjs /tmp/mobile-evidence
# For the next two tests, first serve the repository on localhost:8000.
node tools/qa-interactions.cjs
node tools/qa-transition-recovery.cjs /tmp/recovery.json
```

`qa-transitions` serves the source itself. `QA_BASE_URL` selects a deployed `/v2/`
URL; `QA_SOURCE_ROOT` selects a baseline checkout. It records touch frame samples
and filmstrip frames with delayed finale CSS, checks that the entry does not
scroll, verifies there are no duplicate wall halves or unstyled/transparent
finale frames, and exercises exit/re-entry. The recovery test injects script and
stylesheet failures plus missing production art. These browser checks do not
establish frame rate or visual acceptance on a physical phone.
