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
const evidencePrefix='r3-'+(process.argv[2]||'standard')+'-';
const shot=async name=>{name=evidencePrefix+name;const r=await send('Page.captureScreenshot',{format:'png'});const data=Buffer.from(r.result.data,'base64');writeFileSync(`gen/r9/shots/${name}.png`,data);return createHash('sha256').update(data).digest('hex')};
const audit=()=>js(`(()=>{const root=document.querySelector('#finale');return{phase:root?.dataset.phase,opened:root?.dataset.opened,trail:BB.trail(),line:document.querySelector('#finalLine')?.textContent,reports:[...document.querySelectorAll('#reportTranscript p')].map(e=>e.textContent),hubPhase:document.querySelector('#hub').dataset.phase,hubPaused:BB.finaleActive,overflow:document.documentElement.scrollWidth>innerWidth,focus:document.activeElement.id}})()`);
const dimensions=(process.env.R9_SIZES||'1600x900,390x844').split(',').map(size=>size.split('x').map(Number));
let gestureEvidence=[];
async function nativePath(pts,delay=12,touch=false,label=''){
 if(touch)await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});
 for(let i=0;i<pts.length;i++){await send(touch?'Input.dispatchTouchEvent':'Input.dispatchMouseEvent',touch?{type:'touchMove',touchPoints:[pts[i]]}:{type:'mouseMoved',...pts[i]});await sleep(delay);if(label&&i===Math.floor(pts.length*.72)){const data=await js(`new Promise(r=>requestAnimationFrame(()=>r(document.querySelector('#searchRoom').toDataURL())))`);writeFileSync('gen/r9/shots/'+evidencePrefix+label+'-knot-drawing.png',Buffer.from(data.split(',')[1],'base64'));}}
 if(touch)await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(80);
}
async function threadCenter(){return js(`(()=>{const r=document.querySelector('#tieThreadKnot').getBoundingClientRect();return{x:r.x+24,y:r.y+24}})()`);}
const circle=(p,r=38,direction=1,roundness=1)=>Array.from({length:25},(_,i)=>{const a=direction*i/24*Math.PI*2.18;return{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r*roundness};});
async function falsePaths(name,scene='search'){
 const p=await threadCenter(),cases=[['straight',Array.from({length:42},(_,i)=>({x:p.x-80+i*4,y:p.y-30+i*1.5})),12],['zigzag',Array.from({length:45},(_,i)=>({x:p.x-80+i*3.6,y:p.y+(Math.floor(i/5)%2?1:-1)*20})),12],['s-curve',Array.from({length:55},(_,i)=>({x:p.x-80+i*3,y:p.y+Math.sin(i/54*Math.PI*2)*32})),12],['slow-loop',circle(p),110],['wandering',Array.from({length:90},(_,i)=>({x:p.x+Math.sin(i*.11)*65,y:p.y+Math.sin(i*.073)*26})),32],['off-thread',circle({x:innerWidthSafe(p.x),y:p.y-145},28),12]];
 for(const [kind,pts,delay] of cases){await sleep(220);await nativePath(pts,delay);if(await js('BB.trail().knot'))throw new Error('False positive '+kind);gestureEvidence.push({kind,triggered:false,scene});}
 await shot(name+'-false-paths-clear');
}
function innerWidthSafe(x){return x;}
async function makeKnot(name){
 const p=await threadCenter(),before=await js('BB.trail()'),started=await js('performance.now()');await js(`window.qaGesture=[];if(!window.qaGestureListener){window.qaGestureListener=true;document.addEventListener('pointermove',e=>qaGesture.push({x:e.clientX,y:e.clientY,at:performance.now(),target:e.target.id}),true);}`);
 if(['keyboard','reveal'].includes(mode)){await js(`document.querySelector('#tieThreadKnot').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}
 else{const touch=await js('innerWidth<600');if(touch)await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await nativePath(circle(p,touch?32:44,touch?-1:1,touch?.78:1),0,touch,name);if(touch)await send('Emulation.setTouchEmulationEnabled',{enabled:false});}
 console.log('GESTURE',JSON.stringify(await js(`({size:[innerWidth,innerHeight],phase:document.querySelector('#finale').dataset.phase,samples:qaGesture.length,span:qaGesture.length?qaGesture.at(-1).at-qaGesture[0].at:0,knot:BB.trail().knot})`)));await wait('BB.trail().knot');await sleep(420);await shot(name+'-knot-tied');const after=await js('BB.trail()'),event=after.events.find(e=>e.type==='KNOT');
 if(before.knot||!event||after.events.filter(e=>e.type==='KNOT').length!==1)throw new Error('KNOT event integrity failed');gestureEvidence.push({kind:['keyboard','reveal'].includes(mode)?'keyboard':await js('innerWidth<600')?'touch-loop-ccw':'mouse-loop-cw',event,aligned:after.aligned,elapsedSinceStart:await js('performance.now()')-started});
 if(mode!=='room'&&after.aligned)throw new Error('Gesture unexpectedly required alignment');
}
const results=[];
async function chain(w,h,knot,mod,reduced=false){
 const name=`final-${w}x${h}-${knot?'knot':'standard'}${knot&&!mod?'-no-modified':''}${reduced?'-reduced':''}`;
 await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<600});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});if(process.argv[2]==='cross')await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 await send('Page.navigate',{url:'http://localhost:3200/v2/?c=hound'});await wait(`document.documentElement.classList.contains('ready') && Number(getComputedStyle(document.querySelector('#boot')).opacity)<.001`);await sleep(5000);
 await js(`document.querySelector('#enter').click()`);await wait(`document.querySelector('#hub').dataset.phase==='settled'`);await sleep(900);
 if(w===1600&&!knot&&!mod){await click('#threadTail');await sleep(900);await shot(name+'-counter-pull');await sleep(600);const tailTweens=await js(`gsap.globalTimeline.getChildren(true,true,false).filter(t=>t.targets?.().some(x=>Object.prototype.hasOwnProperty.call(x,'tail'))).length`);await click('#threadTail');await sleep(100);const afterRepeat=await js(`gsap.globalTimeline.getChildren(true,true,false).filter(t=>t.targets?.().some(x=>Object.prototype.hasOwnProperty.call(x,'tail'))).length`);if(afterRepeat!==tailTweens)throw new Error('Counter pull repeated');}
 if(knot&&['room','clue'].includes(mode)){await click('#cornerLift');await click('#graphiteStrip');if(process.argv[2]==='cross'){const id=await js('document.activeElement.id');await click('#'+id);await click('#stripRegister')}else{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}}
 if(mod)await click('#dMod');
 for(const i of [0,2]){await click(`#hubIndex button:nth-child(${i+1})`);await wait(`document.querySelector('#hub').dataset.phase==='settled'&&document.querySelector('#hub').dataset.selected==='${i}'`);if(knot&&['room','clue'].includes(mode)){await click('#cornerLift');await click('#graphiteStrip');if(process.argv[2]==='cross'){const id=await js('document.activeElement.id');await click('#'+id);await click('#stripRegister')}else{await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',unmodifiedText:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}}}
 // Earn an actual repeat in the recorder through the same live index.
 await click('#hubIndex button:nth-child(2)');await wait(`document.querySelector('#hub').dataset.phase==='settled'&&document.querySelector('#hub').dataset.selected==='1'`);
 if(knot&&['room','clue'].includes(mode)){await wait(`BB.trail().aligned`);await shot(name+'-diagram');await click('#stripPiece0');await wait(`document.querySelector('.gesture-diagram-dialog')?.open`);await shot(name+'-diagram-enlarged');await click('.gesture-diagram-dialog button');if(mode==='clue'){results.push({size:[w,h],aligned:await js('BB.trail().aligned'),realChain:true});return;}}
 await wait(`!document.querySelector('#ghostLocation').hidden`);await js(`window.qaPhases=[];new MutationObserver(records=>{if(records.some(r=>r.target.id==='finale')){const f=document.querySelector('#finale');if(f&&!f.hidden&&qaPhases.at(-1)?.phase!==f.dataset.phase)qaPhases.push({phase:f.dataset.phase,at:performance.now()})}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['data-phase','hidden']})`);await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale')?.dataset.phase==='search'`);await sleep(400);await shot(name+'-search-floor');
 await falsePaths(name);if(knot&&(['room','clue'].includes(mode)||mode==='reduced'||mode==='keyboard'))await makeKnot(name);

 await click('#findHuman');await sleep(reduced?60:200);await shot(name+'-hand-pull');await wait(`document.querySelector('#finale').dataset.phase==='reports'`);
 await wait(`document.querySelector('.message-point')`);await shot(name+'-first-point');if(knot&&mode==='notes'){await falsePaths(name,'reports');await makeKnot(name);}
 const reads=[],members=[];
 for(let n=0;n<(['late','reveal'].includes(mode)?8:6);n++){
  if(['late','reveal'].includes(mode)&&n===6){await wait(`document.querySelector('.ending-point')`);if(mode==='reveal'){await click('.ending-point');await wait(`document.querySelector('#finale').dataset.phase==='reveal'`);}await makeKnot(name);if(await js(`!!document.querySelector('.ending-point')`))throw new Error('Late knot lost its factual report');}
  await wait(`document.querySelector('.message-point')`);
  if(n===0&&w===1280){await js(`document.querySelector('.message-point').focus()`);await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});}else await click('.message-point');
  if(n===0&&!reduced){await sleep(220);await shot(name+'-mid-unfold');}
  await wait(`document.querySelector('.light-note.stamped')`);await sleep(220);
  if(n===0)console.log('NOTE METRICS',JSON.stringify(await js(`(()=>{const e=document.querySelector('.light-note'),c=document.querySelector('.note-copy'),s=document.querySelector('.note-stamp');return{size:[innerWidth,innerHeight],width:e.offsetWidth,height:e.offsetHeight,text:getComputedStyle(c).fontSize,stamp:getComputedStyle(s).width}})()`)));
  const report=await js(`({member:document.querySelector('.note-chrome b').textContent,copy:document.querySelector('.note-copy').textContent,time:document.querySelector('.note-chrome small').textContent})`);
  if(/[嘿。]/.test(report.copy))throw new Error('Client copy edit regressed: '+report.copy);members.push(report.member);reads.push(report);await shot(name+'-note-'+(n+1)+'-'+report.member.toLowerCase());
  if(n===0){await sleep(2600);if(!await js(`!!document.querySelector('.light-note:not(.fading)')`))throw new Error('Note timed out');}
  await click('.light-note');await sleep(reduced?240:650);await wait(`!document.querySelector('.light-note')`);if(['late','reveal'].includes(mode)&&n>=6&&report.copy==='线上多了一个结')break;
 }
 if(members.some((m,i)=>i&&m===members[i-1]))throw new Error('Adjacent members repeat');
 await wait(`document.querySelector('.ending-point')`);await click('.ending-point');await sleep(650);await shot(name+'-whole-reveal');
 await wait(`document.querySelector('#finale').dataset.phase==='stop'`);const a=await shot(name+'-stop-a');await sleep(260);const b=await shot(name+'-stop-b');if(a!==b)throw new Error('Hard stop changed pixels');
 await wait(`document.querySelector('#finale').dataset.phase==='line'`);await shot(name+'-final-line');const state=await audit();state.name=name;state.gestureEvidence=gestureEvidence;gestureEvidence=[];if(knot&&!state.reports.some(r=>r.includes('线上多了一个结')))throw new Error('Missing earned knot report');state.reads=reads;state.stopIdentical=a===b;state.realChain=true;
 const expected=knot?'有意思。':'线的另一端，一直在我手里。';if(state.line!==expected)throw new Error('Wrong ending');
 await wait(`document.querySelector('#finale').dataset.phase==='reports'&&document.querySelector('.message-point')`);await shot(name+'-continued-point');await click('.message-point');await wait(`document.querySelector('.light-note.stamped')`);state.loopContinues=true;state.timing=await js(`(()=>{const a=qaPhases.find(p=>p.phase==='stop'),b=qaPhases.find(p=>p.phase==='line'),c=qaPhases.find(p=>p.phase==='reports'&&p.at>b.at);return{stopMs:b.at-a.at,lineMs:c.at-b.at}})()`);if(state.timing.stopMs<990||state.timing.stopMs>1100||state.timing.lineMs<3990||state.timing.lineMs>4100)throw new Error('Timing contract failed '+JSON.stringify(state.timing));state.afterLine=await js(`document.querySelector('.note-copy').textContent`);await click('.light-note');await sleep(reduced?240:650);
 if(state.overflow)throw new Error('Overflow');results.push(state);console.log(JSON.stringify(state));
 await click('#finaleExit');await wait(`!BB.finaleActive&&document.querySelector('#finale').hidden`);await shot(name+'-exit');
 // Same-session SKIP must settle to the earned ending.
 await click('#hubIndex button:nth-child(4)');await wait(`document.querySelector('#finale').dataset.phase==='search'`);await click('#finaleSkip');await wait(`document.querySelector('#finale').dataset.phase==='line'`);if((await audit()).line!==expected)throw new Error('Wrong skip ending');await shot(name+'-skip');await click('#finaleExit');
}
const mode=process.argv[2]||'standard';
try {
 for(const [w,h] of dimensions)await chain(w,h,mode!=='standard',false,mode==='reduced');
 const summary={results,errors,external:network.filter(u=>!u.startsWith('http://localhost:3200/')&&!u.startsWith('data:')),retiredRequests:network.filter(u=>/r8-(console|operator|chair)/.test(u))};
 writeFileSync('gen/r9/shots/'+evidencePrefix+(process.argv[2]||'standard')+'-audit.json',JSON.stringify(summary,null,2));
 if(errors.length||summary.external.length||summary.retiredRequests.length)throw new Error('Runtime/network integrity failure');
 console.log('PASS',results.length,'real chains');
}catch(e){console.error(e);writeFileSync('gen/r9/shots/'+evidencePrefix+'failure.json',JSON.stringify({error:String(e),errors,network},null,2));process.exitCode=1;}
ws.close();chrome.kill('SIGKILL');
