#!/usr/bin/env node
// 真实时间截图：用 Chrome 调试协议打开页面，等动画自然走完，再截一张。
// 用法：node shot.mjs "<url>" out.png [宽=1600] [高=900] [缩放=1] [等待毫秒=5500] [等待后执行的JS] [执行JS后再等毫秒=0]
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
const [url, out, W = 1600, H = 900, DPR = 1, WAIT = 5500, JS = '', WAIT2 = 0] = process.argv.slice(2);
const PORT = 9400 + Math.floor(Math.random() * 400), PROFILE = '/tmp/qa-shot-' + Date.now();
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill('SIGKILL'); } catch {} });
for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(200); } }
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(), listeners = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else listeners.forEach((l) => l(d)); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: +DPR, mobile: +W < 600 });
const loaded = new Promise((res) => listeners.push((d) => d.method === 'Page.loadEventFired' && res()));
await send('Page.navigate', { url }); await loaded; await sleep(+WAIT);
if (JS) { await send('Runtime.evaluate', { expression: JS, awaitPromise: true }); await sleep(+WAIT2); }
const r = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(out, Buffer.from(r.result.data, 'base64')); console.log('saved', out);
process.exit(0);
