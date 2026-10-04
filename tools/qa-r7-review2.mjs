// Local real-time CDP QA for the round 7 hub. Outputs only under gen/r7/shots.
import {spawn} from 'node:child_process';
import {writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const repoRoot=fileURLToPath(new URL('../',import.meta.url));
process.chdir(repoRoot);
mkdirSync(join(repoRoot,'gen/r7/shots'),{recursive:true});
const profile=join(repoRoot,'.qa-chrome','r7-review2');
import {setTimeout as sleep} from 'node:timers/promises';
const port=9478,chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--use-angle=metal','--enable-gpu-rasterization','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding','about:blank'],{stdio:'ignore'});
process.on('exit',()=>{chrome.kill('SIGKILL');rmSync(profile,{recursive:true,force:true})});
for(let i=0;i<60;i++){try{await fetch(`http://127.0.0.1:${port}/json/version`);break}catch{await sleep(100)}}
const tab=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json(),ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),events=[];
ws.onmessage=m=>{const d=JSON.parse(m.data);if(d.id&&pending.has(d.id)){pending.get(d.id)(d);pending.delete(d.id)}else{events.push(d);listeners.forEach(l=>l(d))}};const listeners=[];
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
const js=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.result?.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result?.result?.value};
await send('Page.enable');await send('Runtime.enable');
const nav=async(url,w,h)=>{await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<600});const loaded=new Promise(r=>{const f=d=>{if(d.method==='Page.loadEventFired'){listeners.splice(listeners.indexOf(f),1);r()}};listeners.push(f)});await send('Page.navigate',{url});await loaded;if(url.includes('still=1'))await js(`new Promise((r,j)=>{const start=Date.now(),wait=()=>document.querySelector('#hub')?.dataset.phase==='settled'&&Number(getComputedStyle(document.querySelector('#boot')).opacity)<.001?r():Date.now()-start>10000?j(new Error('settle timeout')):setTimeout(wait,10);wait()})`);else await sleep(1800)};
const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`gen/r7/shots/${name}.png`,Buffer.from(r.result.data,'base64'))};
const audit=`(()=>{const h=document.querySelector('#hub'),n=document.querySelector('#dNote'),paper=document.querySelector('#dossier'),r=paper.getBoundingClientRect(),a=document.querySelector('#heroArt');return{phase:h.dataset.phase,selected:h.dataset.selected,examined:h.dataset.examined,art:h.dataset.art,inner:h.dataset.inner||'placeholder',width:h.clientWidth,scrollWidth:h.scrollWidth,scrollHeight:h.scrollHeight,paper:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},captionVisible:r.top>=0&&r.bottom<=h.clientHeight,indexRight:document.querySelector('#hubIndex').getBoundingClientRect().right,threadStarts:(document.querySelector('#threadCore').getAttribute('d')?.match(/M/g)||[]).length,note:n.textContent,font:getComputedStyle(n).fontFamily,image:a.naturalWidth,loaded:!!window.BB,ghost:!document.querySelector('#ghostLocation').hidden}})()`;

const audit2=`(()=>{const h=document.querySelector('#hub'),a=document.querySelector('#heroArt'),hero=document.querySelector('#heroMotion'),area=document.querySelector('#heroLocation'),r=hero.getBoundingClientRect(),ar=area.getBoundingClientRect(),p=document.querySelector('#dossier').getBoundingClientRect();return{...(${audit}),heroRect:r.toJSON(),areaRect:ar.toJSON(),heroIntersects:r.right>ar.left&&r.left<ar.right&&r.bottom>ar.top&&r.top<ar.bottom,heroOpacity:getComputedStyle(hero).opacity,heroClip:getComputedStyle(document.querySelector('#heroClip')).clipPath,codename:document.querySelector('#heroName').textContent,altLabels:[...document.querySelectorAll('.side-button')].map(e=>e.getAttribute('aria-label')),heroAlt:a.alt,legacyChineseName:document.querySelector('#hub').textContent.includes('武器大师')||[...document.querySelectorAll('#hub [alt],#hub [aria-label]')].some(e=>/武器大师/.test(e.alt||e.getAttribute('aria-label'))),scrollCaption:p.toJSON(),viewportWidth:innerWidth,cssViewport:matchMedia('(max-width:760px)').matches}})()`;
const chain=async(s,w,h)=>{
 await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<600});
 const loaded=new Promise(r=>{const f=d=>{if(d.method==='Page.loadEventFired'){listeners.splice(listeners.indexOf(f),1);r()}};listeners.push(f)});
 await send('Page.navigate',{url:`http://localhost:3200/v2/?c=${s}`});await loaded;await sleep(6000);
 await js("document.querySelector('#enter').click()");await sleep(10000);
};

if(process.argv[2]==='sequences'){
 for(const s of ['luna','hound','smith']){
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  const loaded=new Promise(r=>{const f=d=>{if(d.method==='Page.loadEventFired'){listeners.splice(listeners.indexOf(f),1);r()}};listeners.push(f)});
  await send('Page.navigate',{url:`http://localhost:3200/v2/?c=${s}`});await loaded;await sleep(6000);
  await js(`(async()=>{document.querySelector('#enter').click();await new Promise((r,j)=>{const t=Date.now(),wait=()=>document.querySelector('#hub').dataset.phase==='contained'?r():Date.now()-t>10000?j(new Error('contained timeout')):setTimeout(wait,5);wait()})})()`);
  const start=Date.now();for(const ms of [50,350,800,1200,1600,2400]){await sleep(Math.max(0,start+ms-Date.now()));await shot(`R2-enter-phone-${s}-${ms}`);console.log(s,ms,'actual',Date.now()-start,JSON.stringify(await js(audit2)))}
 }
 console.log('errors',JSON.stringify(events.filter(d=>d.method==='Runtime.exceptionThrown').map(d=>d.params)));ws.close();process.exit(0);
}
const states=[];const onlyLuna=process.argv[2]==='luna',onlyPhone=process.argv[2]==='phone';
for(const [w,h] of (onlyPhone?[[390,844]]:[[1600,900],[1280,720],[800,450],[390,844]]))for(const s of (onlyLuna?['luna']:['luna','hound','smith'])){
 await chain(s,w,h);const name=`R2-${w}x${h}-${s}`,state=await js(audit2);states.push({name,...state});await shot(name);
 console.log(name,JSON.stringify(state));
 if(w===390){await js('document.querySelector("#hub").scrollTop=300');await sleep(100);await shot(name+'-scroll');console.log(name+' scroll',await js('document.querySelector("#dossier").getBoundingClientRect().toJSON()'));await js('document.querySelector("#hub").scrollTop=0')}
 // Preserve separate text and alpha masks to measure occlusion per live letter.
 const masks=await js(`(()=>{const name=document.querySelector('#heroName'),text=name.firstChild,ranges=[...text.textContent].map((letter,i)=>{const r=document.createRange();r.setStart(text,i);r.setEnd(text,i+1);return{letter,rect:r.getBoundingClientRect().toJSON()}});const st=document.createElement('style');st.id='r2Masks';st.textContent='#hub{background:#000!important} #hub *{visibility:hidden!important} #heroName{visibility:visible!important;color:#fff!important;text-shadow:none!important}';document.head.append(st);return ranges})()`);
 await shot(name+'-text-mask');
 await js(`document.querySelector('#r2Masks').textContent='#hub{background:#000!important} #hub *{visibility:hidden!important} #heroArt{visibility:visible!important;filter:brightness(0) invert(1)!important}'`);await shot(name+'-alpha-mask');await js(`document.querySelector('#r2Masks').remove()`);
 writeFileSync(`gen/r7/shots/${name}-letters.json`,JSON.stringify(masks));
}
console.log('errors',JSON.stringify(events.filter(d=>d.method==='Runtime.exceptionThrown').map(d=>d.params)));
writeFileSync(onlyLuna?'gen/r7/shots/review2-luna-final.json':onlyPhone?'gen/r7/shots/review2-phone-final.json':'gen/r7/shots/review2-matrix.json',JSON.stringify(states,null,2));
if(onlyLuna){ws.close();process.exit(0)}
// A real phone entry followed by switching, unlock, reduced motion, and a live resize.
await js('BB.select(0,{user:true});BB.select(1,{user:true});BB.select(2,{user:true})');await sleep(1400);console.log('rapid',await js(audit2));
for(const i of [0,1,2]){await js(`BB.select(${i},{user:true})`);await sleep(1400)}console.log('unlock',await js(audit2));await shot('R2-phone-unlocked');
console.log('invalid',await js(`Promise.all([BB.select(null),BB.select(''),BB.select(-1),BB.select(4),BB.select('bad')])`));
console.log('ghost',await js(`(()=>{BB.select(3);const line=document.querySelector('#systemLine').textContent;let called=0;BB.onGhost=()=>called++;BB.select(3);return{line,called}})()`));
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});for(const i of [0,1,2]){await js(`BB.select(${i})`);await sleep(200);console.log('reduced',await js(audit2));await shot(`R2-phone-reduced-${['luna','hound','smith'][i]}`)}
await send('Emulation.setDeviceMetricsOverride',{width:800,height:450,deviceScaleFactor:1,mobile:false});await sleep(400);console.log('resize',await js(audit2));
console.log('errors-final',JSON.stringify(events.filter(d=>d.method==='Runtime.exceptionThrown').map(d=>d.params)));
ws.close();process.exit(0);
