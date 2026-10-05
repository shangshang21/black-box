// Real-time, real-chain round 9 evidence. No production shortcuts or synthetic trail facts.
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import {createHash} from 'node:crypto';
mkdirSync('gen/r9/shots',{recursive:true});
const profile='/tmp/black-box-r9-'+Date.now(),port=9538+Math.floor(Math.random()*100);
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--use-angle=metal','--enable-gpu-rasterization','--disable-background-timer-throttling','--disable-renderer-backgrounding','about:blank'],{stdio:'ignore'});
process.on('exit',()=>{chrome.kill('SIGKILL');rmSync(profile,{recursive:true,force:true})});
for(let i=0;i<60;i++){try{await fetch(`http://127.0.0.1:${port}/json/version`);break}catch{await sleep(100)}}
const tab=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[],network=[];
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id)}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params);else if(d.method==='Network.requestWillBeSent')network.push(d.params.request.url)};
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
const js=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.result?.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result?.result?.value};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
const wait=async expr=>{await js(`new Promise((r,j)=>{const start=Date.now();const f=()=>{if(${expr})r();else if(Date.now()-start>18000)j(new Error('Wait timeout: '+${JSON.stringify(expr)}));else setTimeout(f,25)};f()})`)};
const click=async sel=>{const p=await js(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el.closest('#finale')&&(!el.closest('#hub')||innerWidth<761))el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(process.argv[2]==='cross'){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await sleep(60);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(80);return}await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});};
const evidencePrefix=process.env.R9_PREFIX||'';
const shot=async name=>{name=evidencePrefix+name;const r=await send('Page.captureScreenshot',{format:'png'});const data=Buffer.from(r.result.data,'base64');writeFileSync(`gen/r9/shots/${name}.png`,data);return createHash('sha256').update(data).digest('hex')};
const audit=()=>js(`(()=>{const root=document.querySelector('#finale');return{phase:root?.dataset.phase,opened:root?.dataset.opened,trail:BB.trail(),line:document.querySelector('#finalLine')?.textContent,reports:[...document.querySelectorAll('#reportTranscript p')].map(e=>e.textContent),hubPhase:document.querySelector('#hub').dataset.phase,hubPaused:BB.finaleActive,overflow:document.documentElement.scrollWidth>innerWidth,focus:document.activeElement.id}})()`);

try{
 await send('Emulation.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://localhost:3200/v2/?finale=1'});await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);
 await click('#findHuman');await wait(`document.querySelector('.message-point')`);await click('.message-point');await sleep(65);const unfolding=await js(`(()=>{const a=document.querySelector('.light-note').getAnimations({subtree:true});a.forEach(x=>x.pause());const canvas=document.querySelector('#searchRoom'),still=document.createElement('img');still.id='qaUnfoldStill';still.src=canvas.toDataURL();still.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';canvas.style.visibility='hidden';canvas.after(still);return a.map(x=>({name:x.animationName,time:x.currentTime}))})()`);await shot('unfold-line');await js(`document.querySelector('#qaUnfoldStill').remove();document.querySelector('#searchRoom').style.visibility='';document.querySelector('.light-note').getAnimations({subtree:true}).forEach(a=>a.play())`);await sleep(100);await shot('unfold-paper');await wait(`document.querySelector('.light-note.stamped')`);await sleep(200);await shot('unfold-stamped');
 await click('.light-note');await sleep(450);await shot('collapse-paper');await sleep(500);await shot('collapse-line');await wait(`!document.querySelector('.light-note')`);
 await wait(`document.querySelector('.message-point')`);await click('.message-point');await sleep(65);
 const before=await js(`(()=>{const e=document.querySelector('.light-note');return{matrix:getComputedStyle(e).transform,ink:Number(getComputedStyle(document.querySelector('.note-copy')).opacity),stamp:Number(getComputedStyle(document.querySelector('.note-stamp')).opacity)}})()`);
 await click('.light-note');const early=await js(`({fading:document.querySelector('.light-note').classList.contains('fading'),stamp:Number(getComputedStyle(document.querySelector('.note-stamp')).opacity),from:document.querySelector('.light-note').style.getPropertyValue('--collapse-from')})`);
 await wait(`!document.querySelector('.light-note')`);if(!early.fading||early.stamp!==0)throw new Error('Interrupted unfold did not collapse cleanly');
 await click('#finaleSkip');await wait(`document.querySelector('#finale').dataset.phase==='line'`);await wait(`document.querySelector('.message-point')`);await click('.message-point');await wait(`document.querySelector('.light-note.stamped')`);await sleep(250);await shot('post-ending-note');
 const perf=await js(`new Promise(resolve=>{const a=[];let prev=performance.now();const f=t=>{a.push(t-prev);prev=t;if(a.length<120)requestAnimationFrame(f);else{const b=a.slice(4).sort((x,y)=>x-y);resolve({fps:1000/(b.reduce((x,y)=>x+y,0)/b.length),p95:b[Math.floor(b.length*.95)],worst:b.at(-1)})}};requestAnimationFrame(f)})`);
 const out={previewVisualOnly:true,midUnfoldAnimationFrozenForScreenshot:unfolding,earlyDismiss:{before,after:early},postEndingPerf:perf,errors};writeFileSync('gen/r9/shots/'+evidencePrefix+'motion-audit.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));if(errors.length)throw new Error('Runtime exceptions');
}catch(e){console.error(e);process.exitCode=1;}
ws.close();chrome.kill('SIGKILL');
