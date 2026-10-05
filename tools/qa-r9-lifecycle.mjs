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
const dimensions=[[1600,900],[1280,720],[800,450],[390,844]];
const results=[];
async function chain(w,h,knot,mod,reduced=false){
 const name=`final-${w}x${h}-${knot?'knot':'standard'}${knot&&!mod?'-no-modified':''}${reduced?'-reduced':''}`;
 await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<600});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});if(process.argv[2]==='cross')await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await send('Page.navigate',{url:'http://localhost:3200/v2/?c=hound'});await wait(`document.documentElement.classList.contains('ready') && Number(getComputedStyle(document.querySelector('#boot')).opacity)<.001`);await sleep(5000);
 await js(`document.querySelector('#enter').click()`);await wait(`document.querySelector('#hub').dataset.phase==='settled'`);await sleep(900);
 if(w===1600&&!knot&&!mod){await click('#threadTail');await sleep(900);await shot(name+'-counter-pull');await sleep(600);const tailTweens=await js(`gsap.globalTimeline.getChildren(true,true,false).filter(t=>t.targets?.().some(x=>Object.prototype.hasOwnProperty.call(x,'tail'))).length`);await click('#threadTail');await sleep(100);const afterRepeat=await js(`gsap.globalTimeline.getChildren(true,true,false).filter(t=>t.targets?.().some(x=>Object.prototype.hasOwnProperty.call(x,'tail'))).length`);if(afterRepeat!==tailTweens)throw new Error('Counter pull repeated');}
 if(knot){await click('#cornerLift');await click('#graphiteStrip');if(process.argv[2]==='cross'){const id=await js('document.activeElement.id');await click('#'+id);await click('#stripRegister')}else{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}}
 if(mod)await click('#dMod');
 for(const i of [0,2]){await click(`#hubIndex button:nth-child(${i+1})`);await wait(`document.querySelector('#hub').dataset.phase==='settled'&&document.querySelector('#hub').dataset.selected==='${i}'`);if(knot){await click('#cornerLift');await click('#graphiteStrip');if(process.argv[2]==='cross'){const id=await js('document.activeElement.id');await click('#'+id);await click('#stripRegister')}else{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}}}
 // Earn an actual repeat in the recorder through the same live index.
 await click('#hubIndex button:nth-child(2)');await wait(`document.querySelector('#hub').dataset.phase==='settled'&&document.querySelector('#hub').dataset.selected==='1'`);
 if(knot){await wait(`BB.trail().aligned`);await shot(name+'-diagram');await click('#stripPiece0');await wait(`document.querySelector('.gesture-diagram-dialog')?.open`);await shot(name+'-diagram-enlarged');await click('.gesture-diagram-dialog button');}
 await wait(`!document.querySelector('#ghostLocation').hidden`);await js(`window.qaPhases=[];new MutationObserver(records=>{if(records.some(r=>r.target.id==='finale')){const f=document.querySelector('#finale');if(f&&!f.hidden&&qaPhases.at(-1)?.phase!==f.dataset.phase)qaPhases.push({phase:f.dataset.phase,at:performance.now()})}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-phase','hidden']})`);await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);await sleep(400);await shot(name+'-search-floor');
 if(knot){await js(`document.querySelector('#tieThreadKnot').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(`BB.trail().knot`);await sleep(350);await shot(name+'-knot-thread');}

 await click('#findHuman');await sleep(reduced?60:200);await shot(name+'-hand-pull');await wait(`document.querySelector('#finale')?.dataset.phase==='reports'`);
 await wait(`document.querySelector('.message-point')`);await shot(name+'-first-point');
 const reads=[],members=[];
 for(let n=0;n<6;n++){
  await wait(`document.querySelector('.message-point')`);
  if(n===0&&w===1280){await js(`document.querySelector('.message-point').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}else await click('.message-point');
  await wait(`document.querySelector('.light-note.stamped')`);await sleep(150);
  const report=await js(`({member:document.querySelector('.note-chrome b').textContent,copy:document.querySelector('.note-copy').textContent,time:document.querySelector('.note-chrome small').textContent})`);
  members.push(report.member);reads.push(report);await shot(name+'-note-'+(n+1)+'-'+report.member.toLowerCase());
  if(n===0){await sleep(2600);if(!await js(`!!document.querySelector('.light-note:not(.fading)')`))throw new Error('Note timed out');}
  await click('.light-note');await sleep(reduced?240:650);await wait(`!document.querySelector('.light-note')`);
 }
 if(members.some((m,i)=>i&&m===members[i-1]))throw new Error('Adjacent members repeat');
 await wait(`document.querySelector('.ending-point')`);await click('.ending-point');await sleep(650);await shot(name+'-whole-reveal');
 await wait(`document.querySelector('#finale')?.dataset.phase==='stop'`);const a=await shot(name+'-stop-a');await sleep(260);const b=await shot(name+'-stop-b');if(a!==b)throw new Error('Hard stop changed pixels');
 await wait(`document.querySelector('#finale')?.dataset.phase==='line'`);await shot(name+'-final-line');const state=await audit();state.name=name;state.reads=reads;state.stopIdentical=a===b;state.realChain=true;
 const expected=knot?'有意思。':'线的另一端，一直在我手里。';if(state.line!==expected)throw new Error('Wrong ending');
 await wait(`document.querySelector('#finale')?.dataset.phase==='reports'&&document.querySelector('.message-point')`);await shot(name+'-continued-point');await click('.message-point');await wait(`document.querySelector('.light-note.stamped')`);state.loopContinues=true;state.afterLine=await js(`document.querySelector('.note-copy').textContent`);await click('.light-note');await sleep(reduced?240:650);
 if(state.overflow)throw new Error('Overflow');results.push(state);console.log(JSON.stringify(state));
 await click('#finaleExit');await wait(`!BB.finaleActive&&document.querySelector('#finale').hidden`);await shot(name+'-exit');
 // Same-session SKIP must settle to the earned ending.
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);await click('#finaleSkip');await wait(`document.querySelector('#finale')?.dataset.phase==='line'`);if((await audit()).line!==expected)throw new Error('Wrong skip ending');await shot(name+'-skip');await click('#finaleExit');
}

const checks={},perf=[];
try{
 if(process.argv[2]==='quick'){
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.navigate',{url:'http://localhost:3200/v2/?c=hound'});await wait(`document.documentElement.classList.contains('ready')&&Number(getComputedStyle(document.querySelector('#boot')).opacity)<.001`);await sleep(5000);await js(`document.querySelector('#enter').click()`);await wait(`document.querySelector('#hub').dataset.phase==='settled'`);
 for(const i of [0,2]){await click(`#hubIndex button:nth-child(${i+1})`);await wait(`document.querySelector('#hub').dataset.phase==='settled'&&document.querySelector('#hub').dataset.selected==='${i}'`)}await wait(`!document.querySelector('#ghostLocation').hidden`);
 }else await chain(390,844,false,false,true);
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);await click('#findHuman');await wait(`document.querySelector('#finale')?.dataset.phase==='reports'`);
 // Wait at the natural slow cadence. No simulated timers or accelerated production clocks.
 await sleep(25500);checks.waitingCap=await js(`document.querySelectorAll('.message-point').length===3`);await shot('lifecycle-three-waiting');
 await click('.message-point');await wait(`document.querySelector('.light-note.stamped')`);await sleep(250);await shot('lifecycle-held-note');
 checks.waitingClearOfNote=await js(`(()=>{const r=document.querySelector('.light-note').getBoundingClientRect();return [...document.querySelectorAll('.message-point')].every(e=>{const p=e.getBoundingClientRect(),x=p.x+p.width/2,y=p.y+p.height/2;return x<r.left||x>r.right||y<r.top||y>r.bottom})})()`);const before=await js(`document.querySelector('#reportTranscript').textContent`);
 const blank=await send('Target.createTarget',{url:'about:blank'});await send('Target.activateTarget',{targetId:blank.result.targetId});await sleep(250);checks.hidden=await js('document.hidden');
 const animationState=()=>js(`document.querySelectorAll('.message-point').length+' / '+[...document.querySelectorAll('.message-point')].map(e=>e.getAnimations({subtree:true}).map(a=>a.currentTime)).join(',')`);const held=await animationState();await sleep(1800);checks.hiddenAnimation=held===await animationState();checks.hiddenClock=before===await js(`document.querySelector('#reportTranscript').textContent`);
 await send('Target.activateTarget',{targetId:tab.id});await send('Page.bringToFront');await send('Target.closeTarget',{targetId:blank.result.targetId});await sleep(250);checks.resumed=await js(`!document.querySelector('#finale').classList.contains('is-paused')`);
 const metrics=`new Promise(resolve=>{const a=[];let prev=performance.now();const f=t=>{a.push(t-prev);prev=t;if(a.length<120)requestAnimationFrame(f);else{const b=a.slice(4).sort((x,y)=>x-y);resolve({fps:1000/(b.reduce((x,y)=>x+y,0)/b.length),p95:b[Math.floor(b.length*.95)],worst:b.at(-1)})}};requestAnimationFrame(f)})`;
 perf.push({label:'Held note / phone DPR2',...await js(metrics)});
 await send('Emulation.setCPUThrottlingRate',{rate:4});perf.push({label:'Held note / phone DPR2 / CPU4x',...await js(metrics)});await send('Emulation.setCPUThrottlingRate',{rate:1});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(`matchMedia('(prefers-reduced-motion: reduce)').matches&&getComputedStyle(document.querySelector('.light-note')).animationName==='none'`);checks.liveMotion=await js(`getComputedStyle(document.querySelector('.message-point'),':before').animationName==='none'&&getComputedStyle(document.querySelector('.light-note')).animationName==='none'`);
 // Native keyboard dismissal and opening; neither needs a pointer.
 await js(`document.querySelector('.light-note').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(`!document.querySelector('.light-note')`);checks.keyboardDismiss=true;
 await js(`document.querySelector('.message-point').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(`document.querySelector('.light-note.stamped')`);checks.keyboardOpen=true;
 await shot('lifecycle-reduced-note');await click('#finaleExit');await wait(`!BB.finaleActive`);
 // Fail one new production asset, keep the hub available, then retry successfully.
 await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.setBlockedURLs',{urls:['*r9-rear-lit.webp*']});
 await send('Page.navigate',{url:'http://localhost:3200/v2/?c=hound'});await wait(`document.documentElement.classList.contains('ready')&&Number(getComputedStyle(document.querySelector('#boot')).opacity)<.001`);await sleep(5000);await js(`document.querySelector('#enter').click()`);await wait(`document.querySelector('#hub').dataset.phase==='settled'`);
 for(const i of [0,2]){await click(`#hubIndex button:nth-child(${i+1})`);await wait(`document.querySelector('#hub').dataset.phase==='settled'&&document.querySelector('#hub').dataset.selected==='${i}'`)}
 await wait(`!document.querySelector('#ghostLocation').hidden`);await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#systemLine').textContent==='RETRY'`);checks.failurePreservesHub=await js(`!BB.finaleActive&&!document.querySelector('#hub').inert`);await shot('lifecycle-load-retry');
 await send('Network.setBlockedURLs',{urls:[]});await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);checks.assetRetry=true;await click('#finaleSkip');await wait(`document.querySelector('#finale')?.dataset.phase==='line'`);await shot('lifecycle-recovered-skip');await click('#finaleExit');
 checks.noExceptions=errors.length===0;checks.noExternalRequests=network.every(u=>u.startsWith('http://localhost:3200/')||u.startsWith('data:'));
 writeFileSync('gen/r9/shots/'+evidencePrefix+'lifecycle-audit.json',JSON.stringify({checks,perf,results,errors},null,2));console.log(JSON.stringify({checks,perf}));if(Object.values(checks).some(v=>!v))throw new Error('Lifecycle check failed');
}catch(e){console.error(e);writeFileSync('gen/r9/shots/'+evidencePrefix+'lifecycle-failure.json',JSON.stringify({error:String(e),checks,perf,errors},null,2));process.exitCode=1}
ws.close();chrome.kill('SIGKILL');
