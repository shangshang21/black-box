// Local real-time CDP QA for the round 7 hub. Outputs only under gen/r7/shots.
import {spawn} from 'node:child_process';
import {writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const repoRoot=fileURLToPath(new URL('../',import.meta.url));
process.chdir(repoRoot);
mkdirSync(join(repoRoot,'gen/r7/shots'),{recursive:true});
const profile=join(repoRoot,'.qa-chrome','r7');
import {setTimeout as sleep} from 'node:timers/promises';
const port=9477,chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'--no-first-run','--use-angle=metal','--enable-gpu-rasterization','--ignore-gpu-blocklist','--disable-background-timer-throttling','--disable-renderer-backgrounding','about:blank'],{stdio:'ignore'});
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
if(['matrix','phone','review','compact','smith'].includes(process.argv[2])){
 for(const [w,h] of (process.argv[2]==='smith'?[[1600,900],[1280,800],[1024,768],[390,844],[800,450],[1024,576],[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440]]:process.argv[2]==='phone'?[[390,844]]:process.argv[2]==='compact'?[[800,450]]:process.argv[2]==='review'?[[800,450],[1024,576],[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440]]:[[1600,900],[1280,800],[1024,768],[390,844]]))for(const s of (process.argv[2]==='smith'?[2]:[0,1,2,3])){await nav(`http://localhost:3200/v2/?hub=1&still=1&sel=${s%3}&c=luna${s===3?'&unlocked=1':''}`,w,h);const name=`D-${w}x${h}-${['luna','hound','smith','unlocked'][s]}`;await shot(name);console.log(name,JSON.stringify(await js(audit)));if(w===390){const metrics=await send('Page.getLayoutMetrics'),height=Math.ceil((await js('document.querySelector("#hub").scrollHeight')));await send('Emulation.setDeviceMetricsOverride',{width:w,height,deviceScaleFactor:1,mobile:true});await sleep(150);await shot(name+'-page')}}
}else if(['sequences','sequence-small','sequence-smith'].includes(process.argv[2])){
 for(const s of (process.argv[2]==='sequence-small'?[1]:process.argv[2]==='sequence-smith'?[2]:[0,1,2])){
  await nav(`http://localhost:3200/v2/?c=${['luna','hound','smith'][s]}`,process.argv[2]==='sequence-small'?800:1280,process.argv[2]==='sequence-small'?450:720);
  await js(`(async()=>{await document.fonts.ready;await new Promise((r,j)=>{const start=Date.now(),wait=()=>window.BB?r():Date.now()-start>10000?j(new Error('hub load timed out')):setTimeout(wait,10);wait()});document.querySelector('main').style.display='none';BB.openHub();await new Promise(r=>{const wait=()=>document.querySelector('#hub').dataset.phase==='contained'?r():setTimeout(wait,5);wait()})})()`);
  const start=Date.now();for(const ms of [50,400,800,1200,1600,2000,2400]){await sleep(Math.max(0,start+ms-Date.now()));await shot(`D-seq-${process.argv[2]==='sequence-small'?'800x450-':''}${['luna','hound','smith'][s]}-${ms}`);console.log('frame',s,ms,'actual',Date.now()-start,JSON.stringify(await js(audit)))}
 }
}else if(process.argv[2]==='switches'){
 await nav('http://localhost:3200/v2/?hub=1&c=luna',1280,720);await sleep(1000);
 for(const s of [1,2,0]){await js(`BB.select(${s},{user:true})`);const start=Date.now();for(const ms of [70,350,700,1150]){await sleep(Math.max(0,start+ms-Date.now()));await shot(`D-switch-${['luna','hound','smith'][s]}-${ms}`);console.log('switch',s,ms,'actual',Date.now()-start,await js(audit))}}
 console.log('errors',JSON.stringify(events.filter(d=>d.method==='Runtime.exceptionThrown').map(d=>d.params)));
}else{
 await nav('http://localhost:3200/v2/?hub=1&c=luna',1600,900);await sleep(1500);console.log('initial',await js(audit));await js('BB.select(1,{user:true})');await sleep(80);await shot('D-mid-switch-hound');await sleep(1600);console.log('hound',await js(audit));await js('BB.select(2,{user:true})');await sleep(1800);console.log('smith',await js(audit));await shot('D-motion-smith-unlocked');
 console.log('rapid',await js(`(async()=>{BB.select(0);BB.select(1);BB.select(2);await new Promise(r=>setTimeout(r,1800));return {selected:document.querySelector('#hub').dataset.selected,phase:document.querySelector('#hub').dataset.phase}})()`));
 console.log('invalid',await js(`Promise.all([BB.select(-1),BB.select(null),BB.select(''),BB.select(20),BB.select('bad')])`));
 console.log('side slots',await js(`(()=>{const slots=[...document.querySelectorAll('#altLocationA,#altLocationB')];return{count:slots.reduce((n,e)=>n+e.children.length,0),ids:slots.map(e=>e.firstElementChild.dataset.suspect),active:document.querySelector('#hub').dataset.selected}})()`));
 console.log('egg',await js(`(()=>{document.querySelector('#dMod').click();document.querySelector('#cornerLift').click();return{clue:document.querySelector('#openedClue').textContent,corner:document.querySelector('#dossier').classList.contains('corner-open')}})()`));
 console.log('ghost',await js(`(()=>{BB.select(3);let called=0;BB.onGhost=()=>called++;BB.select(3);return{line:document.querySelector('#systemLine').textContent,called}})()`));
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await js('BB.select(0)');await sleep(700);await shot('D-reduced-luna');console.log('reduced',await js(audit));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(400);console.log('resize to phone',await js(audit));
 console.log('scroll',await js(`(()=>{const h=document.querySelector('#hub');h.scrollTop=250;return{top:h.scrollTop,horizontal:h.scrollWidth-h.clientWidth,paperBottom:document.querySelector('#dossier').getBoundingClientRect().bottom}})()`));
 console.log('errors',JSON.stringify(events.filter(d=>d.method==='Runtime.exceptionThrown').map(d=>d.params)));
}
ws.close();process.exit(0);
