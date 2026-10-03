#!/usr/bin/env node
// 帧率测量：用 Chrome 调试协议（CDP）打开页面，按 Retina 分辨率跑，逐项关掉怀疑的东西，看帧率怎么变。
// 用法：node perf.mjs "<url>" [width] [height] [dpr]
// 每个"变体"是一段注入页面的 JS/CSS；基线 = 什么都不关。数字越大越好；p95 = 95% 的帧比这个时间快（越小越好）。
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const URL_ = process.argv[2] || 'http://localhost:3200/v2/index.html?c=luna';
const W = +(process.argv[3] || 1440), H = +(process.argv[4] || 900), DPR = +(process.argv[5] || 2);
const PORT = 9333, PROFILE = '/tmp/qa-prof-' + Date.now();
const VARIANTS = JSON.parse(process.env.VARIANTS || 'null');

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check',
  '--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill('SIGKILL'); } catch {} });

let up = false;
for (let i = 0; i < 50 && !up; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); up = true; } catch { await sleep(200); } }
if (!up) { console.error('chrome did not start'); process.exit(1); }
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const listeners = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else listeners.forEach((l) => l(d)); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evalJS = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.exception?.description || 'error' }; return r.result?.result?.value; };

await send('Page.enable'); await send('Runtime.enable'); await send('Performance.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
const loaded = new Promise((res) => listeners.push((d) => d.method === 'Page.loadEventFired' && res()));
const t0 = Date.now(); await send('Page.navigate', { url: URL_ }); await loaded;
console.log(`load event: ${Date.now() - t0} ms  (${W}x${H} @${DPR}x)`);
await sleep(3500);   // 让开场动画走完
if (process.env.LOADINFO) {
  const info = await evalJS(`(() => { const rs = performance.getEntriesByType('resource'); const by = {}; rs.forEach((r) => { const h = new URL(r.name).host; by[h] = by[h] || { n: 0, kb: 0, end: 0 }; by[h].n++; by[h].kb += Math.round((r.encodedBodySize || 0) / 1024); by[h].end = Math.max(by[h].end, Math.round(r.responseEnd)); });
    const slow = rs.slice().sort((a, b) => b.responseEnd - a.responseEnd).slice(0, 8).map((r) => r.name.split('/').slice(-2).join('/').slice(0, 60) + ' end=' + Math.round(r.responseEnd) + 'ms dur=' + Math.round(r.duration));
    const n = performance.getEntriesByType('navigation')[0]; return { by, slow, dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0) }; })()`);
  console.log(JSON.stringify(info, null, 1));
  process.exit(0);
}

const MEASURE = `(async () => { const ts = []; let last = performance.now(); const end = last + 3500;
  await new Promise((res) => { const f = (t) => { ts.push(t - last); last = t; t < end ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
  ts.shift(); ts.sort((a, b) => a - b); const sum = ts.reduce((a, b) => a + b, 0);
  return { frames: ts.length, fps: +(1000 / (sum / ts.length)).toFixed(1), p50: +ts[Math.floor(ts.length * .5)].toFixed(1), p95: +ts[Math.floor(ts.length * .95)].toFixed(1), worst: +ts[ts.length - 1].toFixed(1), over33: ts.filter((x) => x > 33.4).length }; })()`;

const metrics = async () => Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
const run = async (name, js) => {
  if (js) await evalJS(js);
  await sleep(500);
  const m0 = await metrics(); const r = await evalJS(MEASURE); const m1 = await metrics();
  const per = (k) => +(((m1[k] - m0[k]) * 1000) / r.frames).toFixed(2);
  console.log(`${name.padEnd(34)} fps ${String(r.fps).padStart(5)} | p50 ${String(r.p50).padStart(5)} ms | p95 ${String(r.p95).padStart(5)} ms | worst ${String(r.worst).padStart(6)} ms | >33ms ${String(r.over33).padStart(3)} | JS ${per('ScriptDuration')} style ${per('RecalcStyleDuration')} layout ${per('LayoutDuration')} ms/帧`);
};

const css = (rule) => `(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(rule)};document.head.append(s);window.__s=(window.__s||[]);window.__s.push(s);})()`;
const variants = VARIANTS || [
  ['基线（什么都不关）', null],
  ['关掉胶片颗粒层 .grain', css('.grain{display:none!important}')],
  ['再关掉光效 .lfx .glow', css('.lfx,.glow{display:none!important}')],
  ['再关掉雾和贴地阴影 .fog .cs .shadow .refl', css('.fog,.cs,.cs0,.cs2,.shadow,.refl,.halo{display:none!important}')],
  ['再关掉分镜/海报上的滤镜', css('.pnl img,.pst img,.pst .pp,.pst .sh{filter:none!important}')],
  ['再关掉灰尘画布 .dust', css('.dust{display:none!important}')],
  ['再关掉暗角 .vignette', css('.vignette{display:none!important}')],
  ['再关掉红线 .thread', css('.thread{display:none!important}')],
];
for (const [name, js] of variants) await run(name, js);

if (process.env.TRANSITION) {   // 测"点 ENTER 到列队页站稳"这段（约 3 秒）的帧率
  const loadedT = new Promise((res) => listeners.push((d) => d.method === 'Page.loadEventFired' && res()));
  await send('Page.navigate', { url: URL_ }); await loadedT; await sleep(3500);
  if (process.env.PREWARM) { const w = await evalJS(`(async () => { const t0 = performance.now(); const urls = ['hub-poster-luna','hub-poster-hound','hub-poster-smith','hub-poster-ghost'].map((n) => 'assets/' + n + '.webp').concat(['assets/s-plate-k.jpg']); window.__keep = await Promise.all(urls.map(async (u) => { const im = new Image(); im.src = u; try { await im.decode(); } catch (e) {} return im; })); return Math.round(performance.now() - t0) + ' ms 预解码 ' + urls.length + ' 张'; })()`); console.log('预热：', w); await sleep(800); }
  const T = await evalJS(`(async () => { const ts = []; let last = performance.now(); const end = last + 3200; document.getElementById('enter').click();
    await new Promise((res) => { const f = (t) => { ts.push(t - last); last = t; t < end ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
    ts.shift(); const s2 = ts.slice().sort((a, b) => a - b); const sum = ts.reduce((a, b) => a + b, 0);
    return { frames: ts.length, fps: +(1000 / (sum / ts.length)).toFixed(1), p95: +s2[Math.floor(s2.length * .95)].toFixed(1), worst: +s2[s2.length - 1].toFixed(1), over33: ts.filter((x) => x > 33.4).length, over50: ts.filter((x) => x > 50).length, when: (() => { let t = 0; const o = []; ts.forEach((x) => { t += x; if (x > 50) o.push(Math.round(t) + 'ms:' + Math.round(x)); }); return o; })(), hubVisible: getComputedStyle(document.getElementById('hub')).visibility }; })()`);
  console.log('点 ENTER → 列队页：', JSON.stringify(T)); process.exit(0);
}
if (!process.env.HUB) process.exit(0);
// 点 ENTER 进入列队页，再量一遍（只刷新页面再测，保证每次从同一状态开始）
console.log('--- 列队页（点 ENTER 之后）---');
const loaded2 = new Promise((res) => listeners.push((d) => d.method === 'Page.loadEventFired' && res()));
await send('Page.navigate', { url: URL_ }); await loaded2; await sleep(3500);
await evalJS(`document.getElementById('enter').click()`); await sleep(3500);
await run('列队页 基线', null);
await run('列队页 关掉入口页的动画 .scene', css('#scene,.grain,.vignette{display:none!important}'));
await run('列队页 再关掉粉尘/光 #hubDust .lamp', css('#hubDust,#hubLamp,.hub-scrap{display:none!important}'));
process.exit(0);
