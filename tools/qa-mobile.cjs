/* Isolated headless regression checks. Requires Playwright and Chrome.
   node tools/qa-mobile.cjs [artifact directory]
   PLAYWRIGHT_MODULE_PATH can select an already-installed Playwright module. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || 'qa-mobile-artifacts');
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2'};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});

(async () => {
  fs.mkdirSync(output, {recursive:true});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const results = [];
  try {
    browser = await chromium.launch({channel:'chrome', headless:true});
    const cases = [
      [360,800,'luna',true], [390,844,'hound',true], [412,915,'smith',true],
      [844,390,'hound',true], [1440,900,'luna',false], [390,844,'smith',true,'reduce'],
      [384,832,'luna',true]
    ].filter(([width,height]) => !process.env.QA_VIEWPORT || process.env.QA_VIEWPORT===`${width}x${height}`);
    for (const [width,height,who,mobile,reducedMotion='no-preference'] of cases) {
      const name = `${width}x${height}-${who}-${reducedMotion}`;
      const context = await browser.newContext({viewport:{width,height}, deviceScaleFactor:mobile?3:1, isMobile:mobile, hasTouch:mobile, reducedMotion});
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/v2/?c=${who}`);
      await page.waitForFunction(() => document.documentElement.classList.contains('ready') && Number(getComputedStyle(document.querySelector('#enter')).opacity) > .99);
      const entry = await page.evaluate(() => {
        const fig = document.querySelector('.fig'), r = fig.getBoundingClientRect();
        const boxes = {luna:[.3021,.0219,.7742,.9729],hound:[.2812,.0207,.7372,.9660],smith:[.3541,.0202,.6477,.9617]};
        const [x0,y0,x1,y1] = boxes[Scene.who];
        return {width:innerWidth,height:innerHeight,character:Scene.who,decoded:fig.complete && fig.naturalWidth>0,
          alpha:{left:r.x+r.width*x0,right:r.x+r.width*x1,top:r.y+r.height*y0,bottom:r.y+r.height*y1},
          canvasPixels:document.querySelector('.dust').width*document.querySelector('.dust').height};
      });
      assert.equal(entry.width,width,'Scene enlarged mobile layout viewport');
      assert.equal(entry.height,height,'Scene enlarged mobile layout height');
      assert.equal(entry.decoded,true,'Character image did not load');
      if (width<=760) assert(entry.alpha.top>=-2 && entry.alpha.bottom<=height+2,'Portrait character vertically outside viewport');
      else {
        const visibleHeight = Math.min(entry.alpha.bottom,height)-Math.max(entry.alpha.top,0);
        assert(visibleHeight>=Math.min(entry.alpha.bottom-entry.alpha.top,height)*.9,'Cover layout hid most of the character');
      }
      assert(entry.alpha.right>width*.25 && entry.alpha.left<width*.75,'Character horizontally outside viewport');
      if (width<=760) assert(entry.canvasPixels<2_000_000,'Mobile canvas is excessive');
      await page.screenshot({path:path.join(output,`${name}-entry.png`)});
      if (mobile) await page.locator('#enter').tap(); else await page.locator('#enter').click();
      await page.waitForFunction(() => document.querySelector('#hub').dataset.phase==='settled');
      const first = await page.evaluate(() => document.querySelector('.dust').toDataURL());
      await page.waitForTimeout(180);
      assert.equal(await page.evaluate(() => document.querySelector('.dust').toDataURL()),first,'Hidden entry canvas is still rendering');
      for (const index of [0,1,2]) {
        const button = page.locator(`#hubIndex button:nth-child(${index+1})`);
        if (mobile) await button.tap(); else await button.click();
        await page.waitForFunction(index => document.querySelector('#hub').dataset.phase==='settled' && document.querySelector('#hub').dataset.selected===String(index),index);
        assert.equal(await page.locator('#heroArt').evaluate(img => img.naturalWidth>0 && !img.hidden),true);
      }
      await page.screenshot({path:path.join(output,`${name}-hub.png`)});
      assert.equal(await page.locator('#hubIndex button:nth-child(4)').isVisible(),true);
      // One complete mobile story path verifies the viewport fix preserves the finale.
      if (width===390 && who==='hound') {
        await page.locator('#hubIndex button:nth-child(4)').tap();
        try { await page.waitForFunction(() => document.querySelector('#finale')?.dataset.phase==='search'); }
        catch (error) {
          console.log('FINALE_DIAGNOSTIC',await page.evaluate(() => ({phase:document.querySelector('#finale')?.dataset.phase,hubPhase:document.querySelector('#hub').dataset.phase,line:document.querySelector('#systemLine').textContent,assets:performance.getEntriesByType('resource').filter(x=>x.name.includes('finale')||x.name.includes('r9-')).map(x=>x.name)})),errors);
          await page.screenshot({path:path.join(output,'finale-failure.png')});
          throw error;
        }
        await page.locator('#findHuman').tap();
        await page.waitForFunction(() => document.querySelector('#finale').dataset.phase==='reports');
        for (let i=0;i<6;i++) {
          await page.locator('.message-point').waitFor({state:'visible'});
          await page.locator('.message-point').tap();
          await page.locator('.light-note.stamped').waitFor({state:'visible'});
          await page.locator('.light-note').tap();
          await page.waitForFunction(() => !document.querySelector('.light-note'));
        }
        await page.locator('.ending-point').tap();
        await page.waitForFunction(() => document.querySelector('#finale').dataset.phase==='line');
        await page.screenshot({path:path.join(output,`${name}-ending.png`)});
        await page.locator('#finaleExit').tap();
        await page.waitForFunction(() => !BB.finaleActive && document.querySelector('#finale').hidden);
      }
      assert.deepEqual(errors,[],'Uncaught browser errors');
      results.push({name,entry,hubCharacters:3,fourthCharacter:true,errors});
      console.log('PASS '+name);
      await context.close();
    }
    fs.writeFileSync(path.join(output,'regression.json'),JSON.stringify(results,null,2));
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
