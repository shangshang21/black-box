// Real-time, real-chain round 8 evidence. No production shortcuts or synthetic trail facts.
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import {createHash} from 'node:crypto';
mkdirSync('gen/r8/shots',{recursive:true});
const profile='/tmp/black-box-r8-'+Date.now(),port=9538+Math.floor(Math.random()*100);
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
const click=async sel=>{const p=await js(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el.closest('#finale')&&(!el.closest('#hub')||innerWidth<761))el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);if(process.argv[2]==='cross'&&/floorPeg|graphiteStrip|cornerLift|stripPiece|stripRegister/.test(sel)){await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await sleep(60);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(80);return}await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...p});};
const evidencePrefix=process.env.R8_PREFIX||'';
const shot=async name=>{name=evidencePrefix+name;const r=await send('Page.captureScreenshot',{format:'png'});const data=Buffer.from(r.result.data,'base64');writeFileSync(`gen/r8/shots/${name}.png`,data);return createHash('sha256').update(data).digest('hex')};
const audit=()=>js(`(()=>{const root=document.querySelector('#finale');return{phase:root?.dataset.phase,trail:BB.trail(),line:document.querySelector('#finalLine')?.textContent,dialog:document.querySelector('#accessibleDialog')?.textContent,power:root?.dataset.power,alarms:root?.querySelectorAll('.alarm-panel').length,hubPhase:document.querySelector('#hub').dataset.phase,hubPaused:BB.finaleActive,overflow:document.documentElement.scrollWidth>innerWidth,focus:document.activeElement.id}})()`);
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
 if(knot){await wait(`BB.trail().aligned`);await shot(name+'-diagram');await click('#stripPiece0');await wait(`document.querySelector('.floor-diagram-dialog')?.open`);await shot(name+'-diagram-enlarged');await click('.floor-diagram-dialog button');}
 await wait(`!document.querySelector('#ghostLocation').hidden`);await js(`window.qaPhases=[];new MutationObserver(records=>{if(records.some(r=>r.target.id==='finale')){const f=document.querySelector('#finale');if(f&&!f.hidden&&qaPhases.at(-1)?.phase!==f.dataset.phase)qaPhases.push({phase:f.dataset.phase,at:performance.now()})}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-phase','hidden']})`);await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);await sleep(400);await shot(name+'-search-floor');
 if(knot){await click('#floorPegA');await sleep(350);await shot(name+'-knot-lifted');await click('#floorPegB');await wait(`BB.trail().knot`);await sleep(350);await shot(name+'-knot-floor');}
 // Reveal the wall fact without acquiring the upper torso.
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:Math.round(w*(w<600?.37:.36)),y:Math.round(h*(w<600?.22:.40))});await sleep(220);await shot(name+'-wall-mark');
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:Math.round(w*(w<600?.6:.65)),y:Math.round(h*.51)});await sleep(260);await shot(name+'-search-hand');
 await click('#findHuman');await sleep(reduced?80:250);await shot(name+'-hand-pull');await wait(`document.querySelector('#finale').dataset.phase==='console'`);const start=Date.now();
 for(const ms of reduced?[200,2200,4600]:[180,450,800,1600,3600,4700,5400,6800,8400]){await sleep(Math.max(0,start+ms-Date.now()));await shot(`${name}-console-${ms}`);}
 await wait(`document.querySelector('#finale').dataset.phase==='stop'`);await shot(name+'-stop-silence');await wait(`document.querySelector('#finale').dataset.phase==='done'`);const a=await shot(name+'-stop-a');const state=await audit();await sleep(2200);const b=await shot(name+'-stop-b');state.identical=a===b;state.cutMs=await js(`(()=>{const cut=qaPhases.find(p=>p.phase==='cut'),search=qaPhases.find(p=>p.phase==='search');return cut&&search?search.at-cut.at:null})()`);state.name=name;state.realChain=true;results.push(state);console.log(JSON.stringify(state));
 if(a!==b)throw new Error('Stop pixels changed '+name);
 const expected=knot?'这个结，是你打的。':'线的另一端，一直在我手里。';if(state.line!==expected)throw new Error('Wrong ending '+name);
 await click('#finaleExit');await wait(`!BB.finaleActive&&document.querySelector('#finale').hidden`);await shot(name+'-exit');
}

async function extra(){
 const checks={},perf=[];
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 const before=(await audit()).trail.events.length;
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await sleep(250);
 checks.motionRefreshDoesNotRecord=(await audit()).trail.events.length===before;
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale').dataset.phase==='search'`);
 checks.suspendedTickers=await js('gsap.ticker._listeners.length');
 const metrics=`(async()=>{let prev=performance.now();const times=[],end=prev+3400;await new Promise(r=>{const f=t=>{if(times.length)times.push(t-prev);else times.push(0);prev=t;t<end?requestAnimationFrame(f):r()};requestAnimationFrame(f)});times.shift();times.sort((a,b)=>a-b);return{fps:1000/(times.reduce((a,b)=>a+b,0)/times.length),p95:times[Math.floor(times.length*.95)],worst:times.at(-1),over33:times.filter(x=>x>33.4).length}})()`;
 async function touchProfile(label,throttle){await send('Emulation.setCPUThrottlingRate',{rate:throttle});const pending=js(metrics);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:70,y:640}]});for(let i=0;i<24;i++){await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:55+(i%8)*8,y:630+(i%5)*8}]});await sleep(100)}await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});const measurement=await pending;perf.push({label,throttle,...measurement});}
 await touchProfile('phone shared aperture / DPR 2',1);await touchProfile('phone shared aperture / DPR 2 / CPU 4x',4);await send('Emulation.setCPUThrottlingRate',{rate:1});
 writeFileSync('gen/r8/shots/'+evidencePrefix+'extra-progress.json',JSON.stringify({checks,perf},null,2));await shot('real-chain-touch-search');checks.touchRemainsSearch=(await audit()).phase==='search';
 const blank=await send('Target.createTarget',{url:'about:blank'});await send('Target.activateTarget',{targetId:blank.result.targetId});await sleep(250);checks.hidden=await js('document.hidden');const activeBefore=await js('BB.trail().activeSeconds');await sleep(1400);checks.hiddenClockPaused=activeBefore===await js('BB.trail().activeSeconds');await send('Target.activateTarget',{targetId:tab.id});await send('Page.bringToFront');await send('Target.closeTarget',{targetId:blank.result.targetId});await sleep(250);
 // Keyboard action finds the same human; raw events exercise focus and activation.
 await js(`document.querySelector('#findHuman').focus({preventScroll:true})`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait(`document.querySelector('#finale').dataset.phase==='console'`);perf.push({label:'phone console power-on and typing / DPR 2',...await js(metrics)});await sleep(900);perf.push({label:'phone alarm overlap / DPR 2',...await js(metrics)});await wait(`document.querySelector('#finale').dataset.phase==='done'`);checks.keyboardAcquisition=true;
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:180,y:180});const freezeA=await shot('real-chain-stop-pointer-a');await sleep(1500);await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:300,y:700});const freezeB=await shot('real-chain-stop-pointer-b');checks.stoppedPointerStable=freezeA===freezeB;
 await click('#finaleExit');checks.tickResume=await js('gsap.ticker._listeners.length');
 // Touch acquires the human through the actual gesture surface.
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale').dataset.phase==='search'`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:234,y:342}]});await sleep(650);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await wait(`document.querySelector('#finale').dataset.phase==='console'`);checks.touchAcquisition=true;await shot('real-chain-touch-acquisition');await click('#finaleSkip');await click('#finaleExit');
 // A new run changes the live motion preference in the middle of console playback.
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale').dataset.phase==='search'`);await click('#findHuman');await wait(`document.querySelector('#finale').dataset.phase==='console'`);await sleep(2200);await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await wait(`document.querySelector('#finale').dataset.phase==='done'`);checks.liveReducedMotion=(await audit()).line==='线的另一端，一直在我手里。';await shot('real-chain-motion-change');await click('#finaleExit');
 // Block exactly one same-origin artwork request. The hub remains available for RETRY.
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.setBlockedURLs',{urls:['*r8-chair-front.webp*']});
 await send('Page.navigate',{url:'http://localhost:3200/v2/?c=smith'});await wait(`document.documentElement.classList.contains('ready')`);await sleep(5500);await js(`document.querySelector('#enter').click()`);await wait(`document.querySelector('#hub').dataset.phase==='settled'`);
 for(const i of [0,1]){await click(`#hubIndex button:nth-child(${i+1})`);await wait(`document.querySelector('#hub').dataset.phase==='settled'&&document.querySelector('#hub').dataset.selected==='${i}'`)}
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#systemLine').textContent==='RETRY'`);checks.failedAssetPreservesHub=await js(`!BB.finaleActive&&!document.querySelector('#hub').inert`);await shot('real-chain-load-retry');
 await send('Network.setBlockedURLs',{urls:[]});await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);checks.retryRecovered=true;await click('#finaleSkip');await wait(`document.querySelector('#finale').dataset.phase==='done'`);await shot('real-chain-recovered-skip');await click('#finaleExit');
 writeFileSync('gen/r8/shots/'+evidencePrefix+'extra-checks.json',JSON.stringify({checks,perf,errors},null,2));console.log(JSON.stringify({checks,perf,errors}));
}

try{
 if(process.argv[2]==='layout'){await chain(1280,720,true,true);await chain(1600,900,true,true);}else if(process.argv[2]==='extra'){await chain(390,844,false,true);await extra();}else if(process.argv[2]==='smoke'){await chain(1600,900,false,false);}else if(process.argv[2]==='cross'){await chain(390,844,true,false);await chain(390,844,true,false,true);}else if(process.argv[2]==='phone'){await chain(390,844,true,true);}else{for(const [w,h] of dimensions){await chain(w,h,false,false);await chain(w,h,true,true);}await chain(390,844,false,true,true);
 // SKIP is exercised on a new real return to 04, not by a test-only switch.
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale').dataset.phase==='search'`);await click('#finaleSkip');await wait(`document.querySelector('#finale').dataset.phase==='done'`);const skip=await audit();await shot('real-chain-skip');results.push({name:'real-chain-skip',...skip});await click('#finaleExit');
 }
 writeFileSync('gen/r8/shots/'+evidencePrefix+(process.argv[2]||'matrix')+'-audit.json',JSON.stringify({results,errors,externalRequests:[...new Set(network)].filter(u=>!u.startsWith('http://localhost:3200/')&&!u.startsWith('data:'))},null,2));
 console.log('errors',JSON.stringify(errors));
}catch(e){console.error(e);await shot('qa-failure');console.log(await audit());writeFileSync('gen/r8/shots/qa-failure.json',JSON.stringify({results,errors,error:String(e)},null,2));process.exitCode=1}
ws.close();process.exit(process.exitCode||0);
