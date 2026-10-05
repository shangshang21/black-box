/* Round 7. All art coordinates are relative to the visible alpha bounds.
   Replace poses / tune anchors in CONFIG; choreography does not depend on image dimensions. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s), qp = new URLSearchParams(location.search);
  const still = qp.get('still') === '1', motionMQ = matchMedia('(prefers-reduced-motion: reduce)'), phoneMQ = matchMedia('(max-width:760px)'), touchMQ = matchMedia('(hover:none)');
  const CONFIG = window.BB_R7_CONFIG = [
    {file:'luna',no:'01',name:'LUNA',role:'EXECUTOR',status:'ACTIVE',note:['执行者。','她最近一次下单，','是在三天前。'],
      placeholder:{hand:[.51,.36],otherHand:[.1,.48],feet:[[.31,.975],[.69,1]],height:1,x:.65},
      production:{hand:[.765,.347],otherHand:[.09,.322],feet:[[.32,.997],[.59,.90]],height:1,x:.57},
      breakout:{hair:[.40,0],coat:[1,.61],boot:[.32,1]},cut:[[.02,.43],[1,.38]],duration:2.2},
    {file:'hound',no:'02',name:'HOUND',role:'SNIFFER',status:'ACTIVE',note:['嗅探者。','市场上任何风吹草动，','都先经过他的鼻子。'],
      placeholder:{hand:[.07,.49],feet:[[.28,.98],[.84,1]],height:.94,x:.58},
      production:{hand:[.074,.69],peelHand:[.94,.684],feet:[[.43,.915],[.735,.996]],height:.83,x:.6},
      breakout:{ear:[.13,.30],corner:[.94,.684],boot:[.735,1]},cut:[[.77,.72],[.95,1]],duration:1.6},
    {file:'smith',no:'03',name:'SMITH',role:'WEAPONSMITH',status:'DORMANT',note:['休眠，不等于退役。'],
      placeholder:{hand:[.13,.45],feet:[[.16,.985],[.83,1]],height:.98,x:.61},
      production:{hand:[.10,.425],feet:[[.475,.995],[.55,.84]],height:.98,x:.60},
      breakout:{hair:[.425,0],blade:[1,.708],boot:[.475,1]},cut:[[0,.77],[1,.36]],duration:1.8}
  ];
  const hub=$('#hub'), stage=$('#posterStage'), hero=$('#heroMotion'), heroArt=$('#heroArt'), heroClip=$('#heroClip'), panel=$('#panelMotion'), halves=$('#panelHalves'), halfA=$('#panelHalfA'),halfB=$('#panelHalfB'),paper=$('#dossier'),dragEl=$('#dossierDrag');
  const locs=[$('#altLocationA'),$('#altLocationB')], bar=$('#noteBar'), examined=new Set();
  // Semantic visit facts only: no storage, network, pointer samples or keystroke text.
  const trail={events:[],firstShown:null,modified:null,knot:false,aligned:false};
  let activeMs=0,activeSince=null,tugged=false,finaleLoading,suspendedTickers=[],trailSuppressedToken=-1;
  function trailClock(){const running=opened&&!document.hidden&&!window.BB?.finaleActive;if(running&&activeSince===null)activeSince=performance.now();if(!running&&activeSince!==null){activeMs+=performance.now()-activeSince;activeSince=null}}
  function record(type,name){trail.events.push({type,name,at:Math.round((activeMs+(activeSince===null?0:performance.now()-activeSince))/1000)})}
  const snapshot=()=>({...trail,events:trail.events.map(e=>({...e})),activeSeconds:Math.round((activeMs+(activeSince===null?0:performance.now()-activeSince))/1000)});
  document.addEventListener('visibilitychange',trailClock);
  function loadFinale(){return finaleLoading||(finaleLoading=new Promise((resolve,reject)=>{const css=document.createElement('link');css.rel='stylesheet';css.href='finale.css';document.head.append(css);const script=document.createElement('script');script.src='finale.js';script.onload=()=>resolve(window.BB.finale);script.onerror=()=>{script.remove();css.remove();finaleLoading=null;reject(new Error('Finale unavailable'))};document.body.append(script)}))}
  async function beginFinale(){if(window.BB.finaleActive||hub.classList.contains('finale-loading'))return;hub.classList.add('finale-loading');try{const finale=await loadFinale();await finale.start(snapshot());$('#systemLine').textContent=''}catch{$('#systemLine').textContent='RETRY';}finally{hub.classList.remove('finale-loading')}}
  let order=[0,1,2];
  let opened=false,cur=-1,intent=-1,token=0,unlocked=false,fastened=false,openedAt=0,selectionTL,ghostTL,drag,resizeFrame,threadFrame,clueTimer,ghostTimer,reduced=motionMQ.matches,oldCardTarget;
  const calm=()=>still||reduced, clock=t=>new Date(t).toLocaleTimeString('en-GB',{hour12:false});
  const rope={taut:0,swing:0,tail:0}, geom={left:0,top:0,width:0,height:0}, par={x:0,y:0};
  const buttonMarkup=text=>`<i class="b-slab"></i><span class="b-face"><i class="b-tri"></i><span class="e-txt">${text}</span></span>`;
  function loadImage(url){return new Promise(resolve=>{const img=new Image();img.decoding='async';img.onload=async()=>{try{await img.decode()}catch{}resolve(img)};img.onerror=()=>resolve(null);img.src=url})}
  // A low-resolution alpha scan ignores isolated keying specks and transparent padding.
  function alphaBox(img){
    try{const c=document.createElement('canvas'),k=Math.min(1,512/img.naturalHeight);c.width=Math.ceil(img.naturalWidth*k);c.height=Math.ceil(img.naturalHeight*k);const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);const d=ctx.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){if(d[(y*c.width+x)*4+3]>110){let neighbors=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)if(x+b>=0&&x+b<c.width&&y+a>=0&&y+a<c.height&&d[((y+a)*c.width+x+b)*4+3]>110)neighbors++;if(neighbors>5){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}}}
      if(x1>x0)return [x0/c.width,y0/c.height,(x1+1)/c.width,(y1+1)/c.height];
    }catch{}return [0,0,1,1];
  }
  const art=CONFIG.map(p=>({img:null,box:null,production:false,ready:null}));
  async function productionAsset(i){const p=CONFIG[i];try{const u=`assets/r7-char-${p.file}.webp`;const r=await fetch(u,{method:'HEAD',cache:'no-store'});if(r.ok){const img=await loadImage(u);if(img){art[i].img=img;art[i].box=alphaBox(img);art[i].production=true;return true}}}catch{}return false}
  art.forEach((a,i)=>{a.ready=(async()=>{const img=await loadImage(`assets/s-${CONFIG[i].file}-char.webp`);a.img=img;a.box=img?alphaBox(img):[0,0,1,1];await productionAsset(i)})()});
  let innerReady=false;
  async function tryInner(){if(innerReady)return;try{const r=await fetch('assets/r7-inner.jpg',{method:'HEAD',cache:'no-store'});if(r.ok){const img=await loadImage('assets/r7-inner.jpg');if(img){innerReady=true;document.querySelectorAll('.panel-inner').forEach(e=>e.style.backgroundImage="url('assets/r7-inner.jpg')");hub.dataset.inner='production'}}}catch{}}
  tryInner();
  // 侧卡头像的取景点：海报里脸的中心（宽、高的比例），手机上只露出卡片左边那一小块，要对准脸
  const FACE={luna:[.47,.21],hound:[.5,.27],smith:[.6,.22],ghost:[.6,.2]};
  const cardData=[...CONFIG,{file:'ghost',no:'04',name:'UNKNOWN'}];
  const cards=cardData.map((p,i)=>{
    const el=document.createElement('div');el.className='side-motion';el.dataset.suspect=i;
    el.innerHTML=`<div class="side-parallax"><div class="side-paper"><button class="side-button" type="button" aria-label="${p.no} / ${p.name}"><img class="side-art" style="--fx:${FACE[p.file][0]};--fy:${FACE[p.file][1]}" src="assets/hub-poster-${p.file}.webp" alt="${i===3?'Redacted':p.name} portrait"><span class="side-label"><span class="side-number">${p.no}</span><span class="side-name">${i===3?'<span class="ghost-name"></span><span class="ghost-signal">SIGNAL WEAK</span>':p.name}</span></span></button><i class="side-tape"></i></div></div>`;
    const img=el.querySelector('img');const ready=new Promise(resolve=>{const done=async()=>{if(img.naturalWidth){try{await img.decode()}catch{}}else img.classList.add('failed');resolve()};if(img.complete)done();else{img.addEventListener('load',done,{once:true});img.addEventListener('error',done,{once:true})}});
    el.querySelector('button').addEventListener('click',()=>i===3?activateGhost():select(i,{user:true}));return{el,img,ready};
  });
  const index=cardData.map((p,i)=>{const b=document.createElement('button');b.type='button';b.className='hub-b index-button v-b';b.innerHTML=buttonMarkup(p.no);b.setAttribute('aria-label',`${p.no} / ${p.name}`);b.setAttribute('aria-pressed','false');b.hidden=i===3;b.addEventListener('click',()=>i===3?activateGhost():select(i,{user:true}));$('#hubIndex').append(b);return b});
  for(let i=0;i<24;i++){const d=document.createElement('i');d.style.left=`${(i*37+13)%100}%`;d.style.top=`${(i*19+7)%95}%`;d.style.animationDelay=`${-i*1.3}s`;d.style.animationDuration=`${17+i%5*3}s`;$('#hubDust').append(d)}
  function placeCards(){cards[cur].el.remove();order.slice(1).forEach((i,k)=>locs[k].replaceChildren(cards[i].el));if(unlocked)$('#ghostLocation').append(cards[3].el)}
  function anchors(){return CONFIG[cur][art[cur].production?'production':'placeholder']}
  function setArt(){const a=art[cur],p=CONFIG[cur];hub.dataset.character=p.file;hub.dataset.art=a.production?'production':'placeholder';if(a.img){heroArt.src=a.img.src;$('#heroShadow img').src=a.img.src;$('#heroReflection img').src=a.img.src;}heroArt.alt=`${p.name}, full body emerging from the case file`;heroArt.hidden=!a.img;heroArt.style.clipPath='none';layoutHero()}
  function layoutHero(){
    if(cur<0||!art[cur].img)return;
    const a=art[cur],b=a.box,c=anchors(),area=$('#heroLocation'),ratio=(b[2]-b[0])*a.img.naturalWidth/((b[3]-b[1])*a.img.naturalHeight),targetH=area.clientHeight*c.height,h=phoneMQ.matches?Math.min(targetH,area.clientWidth*.98/ratio):targetH,w=h*ratio,x=(phoneMQ.matches?Math.max(w/2,Math.min(area.clientWidth-w/2,area.clientWidth*c.x)):area.clientWidth*c.x)-w/2,y=area.clientHeight-h;
    Object.assign(geom,{left:x,top:y,width:w,height:h});
    const iw=w/(b[2]-b[0]),ih=h/(b[3]-b[1]),left=x-b[0]*iw,top=y-b[1]*ih;
    for(const e of [hero,$('#heroShadow')]){e.style.width=`${iw}px`;e.style.height=`${ih}px`;e.style.left=`${left}px`;e.style.top=`${top}px`}
    const reflection=$('#heroReflection');reflection.style.left=`${left}px`;reflection.style.top=`${y+h}px`;reflection.style.width=`${iw}px`;reflection.querySelector('img').style.height=`${ih}px`;$('#heroShadow').parentElement.style.clipPath=containedClip();
    gsap.set(hero,{transformOrigin:`${(b[0]+(b[2]-b[0])*.5)*100}% ${b[3]*100}%`});
    [...$('#contactLayer').children].forEach((e,k)=>{e.hidden=cur===2&&a.production&&k===1;e.style.left=`${x+c.feet[k][0]*w}px`;e.style.top=`${y+c.feet[k][1]*h}px`;e.style.width=`${w*.23}px`});
  }
  function rect(el){const r=el.getBoundingClientRect(),h=hub.getBoundingClientRect();return{x:r.left-h.left,y:r.top-h.top+hub.scrollTop,w:r.width,h:r.height}}
  // Follow the posed silhouette through containment, the step / hop, and parallax.
  function artPoint(a){const r=rect($('#heroLocation')),sx=Number(gsap.getProperty(hero,'scaleX'))||1,sy=Number(gsap.getProperty(hero,'scaleY'))||1,angle=(Number(gsap.getProperty(hero,'rotation'))||0)*Math.PI/180,dx=(a[0]-.5)*geom.width*sx,dy=(a[1]-1)*geom.height*sy;return{x:r.x+geom.left+geom.width*.5+dx*Math.cos(angle)-dy*Math.sin(angle)+(Number(gsap.getProperty(hero,'x'))||0)+(Number(gsap.getProperty($('#heroParallax'),'x'))||0),y:r.y+geom.top+geom.height+dx*Math.sin(angle)+dy*Math.cos(angle)+(Number(gsap.getProperty(hero,'y'))||0)+(Number(gsap.getProperty($('#heroParallax'),'y'))||0)}}
  function containedPose(){
    const p=rect($('#mainPanel')),r=rect($('#heroLocation')),center=p.x+p.w*(cur===1?.65:.54),margin=Math.max(8,p.h*.025);
    // Fit the entire visible alpha box between the unequal edges, including hair and soles.
    let scale=.8,foot,top;
    for(;scale>.2;scale-=.005){const l=(center-geom.width*scale/2-p.x)/p.w,rr=(center+geom.width*scale/2-p.x)/p.w;top=p.y+p.h*(.12-.12*l)+margin;foot=p.y+p.h*(.83+.17*l)-margin;if(l>.055&&rr<.91&&foot-geom.height*scale>=top)break}
    return{scale,x:center-(r.x+geom.left+geom.width*.5),y:foot-(r.y+geom.top+geom.height),opacity:1,rotation:0};
  }
  function positionPeel(){
    if(cur!==1)return;const p=rect(panel),hand=artPoint(anchors().peelHand||[.94,.68]),corner={x:p.x+p.w*.94,y:p.y+p.h*.985},e=$('#peelCorner');
    // The lifted tip sits under his gripping fingers; the other vertex stays on the paper.
    const x=hand.x-9,y=hand.y-8,width=Math.max(phoneMQ.matches?24:50,corner.x-x),height=Math.max(46,corner.y-y);
    Object.assign(e.style,{left:`${(x-p.x)/p.w*100}%`,top:`${(y-p.y)/p.h*100}%`,width:`${width/p.w*100}%`,height:`${height/p.h*100}%`});
  }
  function containedClip(){const p=rect($('#mainPanel')),h=rect($('#heroLocation'));const pts=[[.02,.12],[1,0],[.94,1],[0,.83]];return `polygon(${pts.map(([x,y])=>`${p.x+x*p.w-h.x}px ${p.y+y*p.h-h.y}px`).join(',')})`}
  function updateThread(){
    if(!opened||cur<0)return;const c=anchors(),a=artPoint(c.hand),p=rect($('#panelParallax')),pin=rect($('#dPin')),d={x:pin.x+pin.w/2,y:pin.y+pin.h/2},w=hub.clientWidth,h=Math.max(hub.clientHeight,$('#hubFlow').offsetHeight);
    let path;const b=c.otherHand?artPoint(c.otherHand):null;
    const panelEdge=p.x+p.w*.955,phone=phoneMQ.matches,right=phone?w-9:Math.max(panelEdge+8,a.x+geom.width*.09),pinApproach={x:d.x-30,y:d.y-32};
    if(cur===0){
      // One garrote: left fist -> right fist -> a single sag -> pin.
      const sag=18*(1-rope.taut),end=phone?`C${right} ${a.y+45} ${right} ${d.y-30} ${right} ${d.y-20} Q${right-45} ${d.y+4} ${d.x} ${d.y}`:`C${a.x+(d.x-a.x)*.42} ${a.y+35+sag} ${d.x-95} ${d.y+42+sag} ${d.x} ${d.y}`;
      path=`M${b.x} ${b.y} Q${(a.x+b.x)/2} ${(a.y+b.y)/2+sag*.25} ${a.x} ${a.y} ${end}`;
    }else{
      // A single unbroken stroke: held loop, outer boot gutter, paper seam, pin.
      // Route under the live codename as well as under the soles.
      const sole=artPoint(c.feet[cur===2?0:1]),leftSole=artPoint(c.feet[0]),gutter=sole.y+14,loopY=a.y+Math.min(geom.height*.10,65)+rope.swing*8,loopW=Math.min(17,geom.width*.035);
      path=`M${a.x} ${a.y} C${a.x-loopW} ${loopY} ${a.x+loopW} ${loopY+5} ${a.x+5} ${a.y+5} C${a.x-16} ${a.y+45} ${leftSole.x-42} ${gutter-12} ${leftSole.x} ${gutter-8} C${leftSole.x+80} ${gutter+8} ${right-28} ${gutter+10} ${right} ${gutter-35}`;
      path+=phone?`C${right+4} ${gutter-65} ${right} ${d.y-48} ${right} ${d.y-20} Q${right-42} ${d.y+4} ${d.x} ${d.y}`:`C${right+10} ${gutter-100} ${pinApproach.x-35} ${pinApproach.y} ${d.x} ${d.y}`;
    }
    positionPeel();
    let t={x:d.x-20,y:d.y-36+rope.tail};
    if(fastened){const g=rect($('#ghostLocation'));if(phoneMQ.matches){const right=w-10;path+=` Q${right-50} ${d.y+6} ${right} ${d.y-18} L${right} ${g.y+22} Q${right} ${g.y+6} ${g.x+g.w*.9} ${g.y+10}`}else path+=` Q${d.x-30} ${d.y-26} ${g.x+g.w*.9} ${g.y+10}`}
    else path+=` Q${d.x-26} ${d.y-20+rope.tail} ${t.x} ${t.y}`;
    $('#strings').setAttribute('viewBox',`0 0 ${w} ${h}`);$('#strings').style.height=`${h}px`;$('#threadShadow').setAttribute('d',path);$('#threadCore').setAttribute('d',path);$('#threadTail').style.left=`${t.x-14}px`;$('#threadTail').style.top=`${t.y-14}px`;$('#threadTail').hidden=fastened;
  }
  function threadTick(){if(!threadFrame)threadFrame=requestAnimationFrame(()=>{threadFrame=0;updateThread()})}
  function layout(){resizeFrame=0;if(!opened)return;layoutHero();if(hub.dataset.phase==='contained')heroClip.style.clipPath=containedClip();if(drag){drag.applyBounds({minX:-12,maxX:12,minY:-10,maxY:14})}updateThread()}
  function scheduleLayout(){if(!resizeFrame)resizeFrame=requestAnimationFrame(layout)}
  function configureDrag(){drag?.kill();drag=null;gsap.set(dragEl,{x:0,y:0});if(!phoneMQ.matches&&window.Draggable){if(window.InertiaPlugin)gsap.registerPlugin(Draggable,InertiaPlugin);drag=Draggable.create(dragEl,{type:'x,y',trigger:$('#dGrip'),inertia:!calm(),bounds:{minX:-12,maxX:12,minY:-10,maxY:14},edgeResistance:1,onDrag:threadTick,onThrowUpdate:threadTick})[0]}layout()}
  function fill(){const p=CONFIG[cur];openedAt=Date.now();$('#heroName').textContent=p.name;$('#heroRole').textContent=`${p.no} / ${p.role}`;$('#dNo').textContent=`FILE ${p.no}`;$('#dStatus').textContent=p.status;$('#dNote').replaceChildren(...p.note.map(text=>{const s=document.createElement('span');s.className='note-part';s.textContent=text;return s}));$('#dMod').textContent=clock(openedAt-3000);$('#openedClue').textContent='';$('#openedClue').setAttribute('aria-hidden','true');clearTimeout(clueTimer);gsap.set($('#openedClue'),{opacity:0});paper.classList.remove('corner-open');$('#graphiteStrip').hidden=true;$('#cornerLift').setAttribute('aria-pressed','false');$('#systemLine').textContent=''}
  function reset(){
    gsap.killTweensOf($('#cutIn'));hub.classList.remove('switch-cover');
    gsap.set([hero,panel,halves,halfA,halfB,$('#peelCorner'),$('#sliceFragment')],{x:0,y:0,rotation:0,rotationX:0,rotationY:0,scale:1,opacity:1});
    gsap.set($('#cutLine'),{opacity:0});gsap.set($('#cutIn'),{opacity:0,x:0,scaleX:1});gsap.set([$('#heroNameLocation'),$('#evidenceArea'),$('#contactLayer')],{opacity:1});gsap.set($('#heroShadow'),{opacity:.42});gsap.set($('#heroReflection'),{opacity:.075});gsap.set(bar,{scaleX:0});gsap.set($('#stamp'),{opacity:.8});heroClip.style.clipPath='none';rope.taut=0;rope.swing=0;$('#outgoing').replaceChildren();
  }
  function settled(){heroClip.style.clipPath='none';gsap.set(hero,{x:0,y:0,scale:1,rotation:0,opacity:1});gsap.set(panel,{scale:.978,x:0,y:0});if(cur===2){gsap.set(halfA,{x:-2,y:-.4});gsap.set(halfB,{x:2,y:.4})}else gsap.set([halfA,halfB],{x:0,y:0});gsap.set($('#peelCorner'),{opacity:cur===1?1:0,rotationY:0,scale:1});gsap.set($('#sliceFragment'),{opacity:cur===0?.7:0,x:cur===0?6:0});rope.taut=0;gsap.set([$('#heroNameLocation'),$('#evidenceArea'),$('#contactLayer')],{opacity:1});gsap.set($('#heroShadow'),{opacity:.42});gsap.set($('#heroReflection'),{opacity:.075});gsap.set(bar,{scaleX:0});gsap.set($('#stamp'),{opacity:.8});updateThread()}
  function cutPath(){return CONFIG[cur].cut.map(([x,y],i)=>`${i?'L':'M'}${x*100} ${y*100}`).join(' ')}
  function sound(kind,vol,user){if(user)window.SFX?.[kind]?.(vol)}
  function release(tl,at){tl.call(()=>{heroClip.style.clipPath='none';hub.dataset.phase='breaking'},[],at).to(panel,{scale:.978,duration:.3,ease:'power3.out'},at).to($('#contactLayer'),{opacity:1,duration:.2},at).to($('#heroShadow'),{opacity:.42,duration:.2},at).to($('#heroReflection'),{opacity:.075,duration:.2},at)}
  function caption(tl,at,end){tl.to($('#heroNameLocation'),{opacity:1,y:0,duration:.24,ease:'power3.out'},at).to($('#evidenceArea'),{opacity:1,y:0,duration:.24,ease:'power2.out'},at+.04).to(bar,{scaleX:0,duration:.28,ease:'power3.inOut'},end-.3).to($('#stamp'),{opacity:.8,duration:.1},end-.1)}
  // LUNA: anticipation -> taut garrote -> clean cut -> one heavy, foot-locked step.
  function lunaTimeline(tl,short,user){const cut=short?.27:.98,end=short?.95:CONFIG[cur].duration;tl.to(rope,{taut:1,duration:short?.12:.38,ease:'power2.in'},short?.1:.53);tl.set($('#cutLine'),{attr:{d:cutPath()},opacity:.95},cut).to($('#cutLine'),{opacity:0,duration:.17},cut+.06).to($('#sliceFragment'),{x:6,y:3,opacity:.7,duration:short?.2:.35,ease:'power4.out'},cut);release(tl,cut+.025);tl.to(hero,{scale:1,x:0,y:0,opacity:1,duration:short?.42:.72,ease:'power4.out'},cut+.025).to(rope,{taut:0,duration:.22},cut+.2).call(()=>sound('thud',.10,user),[],short?.67:1.68);caption(tl,short?.64:1.67,end)}
  // HOUND: the corner lifts for a peek, then he hops through and settles with a sly tilt.
  function houndTimeline(tl,short,user){const peel=short?.13:.25,hop=short?.32:.57,end=short?.91:CONFIG[cur].duration;tl.fromTo($('#peelCorner'),{opacity:0,rotationY:0,scale:.35},{opacity:1,rotationY:-36,scale:1,duration:short?.17:.28,ease:'power2.out',immediateRender:false},peel).to(hero,{y:containedPose().y-8,rotation:-.7,duration:short?.12:.2,ease:'power2.out'},peel).call(()=>sound('snap',.07,user),[],peel+.1);release(tl,hop);tl.to(hero,{x:0,y:0,scale:1,opacity:1,rotation:.4,duration:short?.32:.48,ease:'back.out(1.15)'},hop).to(hero,{rotation:0,duration:.23,ease:'sine.out'},hop+(short?.29:.43)).to($('#peelCorner'),{rotationY:0,duration:.25},hop).call(()=>sound('thud',.07,user),[],hop+(short?.28:.42)).to(rope,{swing:1,duration:.15},hop+.15).to(rope,{swing:-.4,duration:.22},hop+.3).to(rope,{swing:0,duration:short?.17:.3},hop+(short?.4:.52));caption(tl,short?.61:1.08,end)}
  // SMITH: held stillness -> instant line -> 80ms hit-stop -> two halves part.
  function smithTimeline(tl,short,user){const hit=short?.28:.8,open=hit+.08,end=short?.95:CONFIG[cur].duration;tl.set($('#cutLine'),{attr:{d:cutPath()},opacity:1},hit).call(()=>sound('snap',.105,user),[],hit).set($('#cutLine'),{opacity:0},open+.03);release(tl,open);tl.to(halfA,{x:-10,y:-9,rotation:-.4,duration:.3,ease:'expo.out'},open).to(halfB,{x:12,y:10,rotation:.4,duration:.3,ease:'expo.out'},open).to(hero,{scale:1,x:0,y:0,opacity:1,duration:short?.28:.5,ease:'expo.out'},open).to(halfA,{x:-2,y:-.4,rotation:0,duration:.24},open+.3).to(halfB,{x:2,y:.4,rotation:0,duration:.24},open+.3).to(rope,{swing:.65,duration:short?.12:.18},open).to(rope,{swing:0,duration:short?.4:.65,ease:'sine.out'},open+(short?.12:.18));caption(tl,short?.68:1.25,end)}
  const factories=[lunaTimeline,houndTimeline,smithTimeline];
  function completeRead(i,t){if(t!==token||intent!==i)return;settled();if(t!==trailSuppressedToken){trail.firstShown??=CONFIG[i].name;record(examined.has(i)?'REPEAT':'DISPLAY',CONFIG[i].name);}examined.add(i);hub.dataset.examined=[...examined].sort().join(',');hub.dataset.selected=String(i);hub.dataset.phase='settled';document.documentElement.dataset.ready='1';if(examined.size===3)revealGhost()}
  function animateIncoming(t,user,initial){hub.dataset.phase='contained';heroClip.style.clipPath=containedClip();gsap.set(hero,containedPose());gsap.set([$('#heroNameLocation'),$('#evidenceArea'),$('#heroShadow'),$('#heroReflection'),$('#contactLayer')],{opacity:0});gsap.set([$('#heroNameLocation'),$('#evidenceArea')],{y:5});gsap.set(bar,{scaleX:1});gsap.set($('#stamp'),{opacity:0});gsap.set($('#sliceFragment'),{opacity:0});gsap.set($('#peelCorner'),{opacity:0});const tl=gsap.timeline({onUpdate:threadTick,onComplete:()=>completeRead(cur,t)});if(initial)tl.fromTo(panel,{y:16,scale:1.025,opacity:0},{y:0,scale:1,opacity:1,duration:.3,ease:'power3.out'},0);factories[cur](tl,!initial,user);return tl}
  async function select(value,options={}){
    const i=Number(value);if(value===null||value===''||!Number.isInteger(i)||i<0||i>3||!opened)return false;if(i===3){if(unlocked)activateGhost();return unlocked}if(i===intent&&!options.refresh)return true;
    intent=i;const t=++token;trailSuppressedToken=options.record===false?t:-1;selectionTL?.kill();reset();index.forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));hub.dataset.phase='decoding';await Promise.all([art[i].ready,cards[i].ready]);if(t!==token)return false;
    const previous=cur,initial=previous<0;
    const swap=()=>{if(t!==token)return;const slot=order.indexOf(i);if(slot>0)[order[0],order[slot]]=[order[slot],order[0]];cur=i;placeCards();fill();setArt();reset();layout()};
    if(calm()){
      if(reduced&&!still&&!initial){gsap.set($('#cutIn'),{opacity:1});swap();settled();selectionTL=gsap.timeline({onComplete:()=>completeRead(i,t)}).to($('#cutIn'),{opacity:0,duration:.14});return true}
      swap();completeRead(i,t);return true;
    }
    if(initial){swap();selectionTL=animateIncoming(t,options.user,true);return true}
    oldCardTarget=rect(cards[i].el);const sr=rect(stage),hr=rect(hero);const out=hero.cloneNode(true);out.removeAttribute('id');out.querySelector('img').removeAttribute('id');out.style.left=`${hr.x-sr.x}px`;out.style.top=`${hr.y-sr.y}px`;out.style.width=`${hr.w}px`;out.style.height=`${hr.h}px`;out.style.transform='none';$('#outgoing').append(out);gsap.set(hero,{opacity:0});hub.classList.add('switch-cover');
    $('#cutInArt').src=cards[i].img.src;const cover=gsap.timeline({onUpdate:threadTick});selectionTL=cover;
    cover.fromTo($('#cutIn'),{x:160,opacity:0,scaleX:.9},{x:0,opacity:1,scaleX:1,duration:.16,ease:'power4.out'},0).to(out,{x:oldCardTarget.x-hr.x,y:oldCardTarget.y-hr.y,scale:Math.min(oldCardTarget.w/hr.w,oldCardTarget.h/hr.h),opacity:0,duration:.25,ease:'power3.in',transformOrigin:'50% 20%'},0).call(()=>{if(t!==token)return;swap();const incoming=animateIncoming(t,options.user,false);selectionTL=incoming;hub.classList.add('switch-cover');gsap.fromTo($('#cutIn'),{x:0,opacity:1},{x:-200,opacity:0,duration:.17,ease:'power3.in',onComplete:()=>hub.classList.remove('switch-cover')});},[],.15);
    return true;
  }
  function revealGhost(dev=false){if(unlocked)return;unlocked=true;loadFinale().then(f=>f.preload()).catch(()=>{});$('#ghostLocation').hidden=false;index[3].hidden=false;$('#ghostLocation').append(cards[3].el);hub.classList.add('unlocked');if(dev||calm()){fastened=true;updateThread();return}gsap.set(cards[3].el,{y:-16,opacity:0});gsap.set(index[3],{opacity:0});ghostTL=gsap.timeline({onUpdate:threadTick}).to(cards[3].el,{y:0,opacity:1,duration:.42,ease:'power3.out'},.2).call(()=>{fastened=true;updateThread()},[],.48).to(index[3],{opacity:1,duration:.2},.52)}
  function activateGhost(){if(!unlocked)return;if(typeof window.BB.onGhost==='function'){window.BB.onGhost();return}clearTimeout(ghostTimer);$('#systemLine').textContent='NO SIGNAL';if(!calm())gsap.timeline().set(cards[3].el,{x:2}).to(cards[3].el,{x:-2,duration:.065,ease:'steps(1)'}).to(cards[3].el,{x:0,duration:.135,ease:'steps(1)'});ghostTimer=setTimeout(()=>$('#systemLine').textContent='',1800)}
  function initialIndex(){const sel=qp.get('sel');if(sel!==null&&/^[0-2]$/.test(sel))return Number(sel);return({luna:0,hound:1,smith:2})[window.Scene?.who||qp.get('c')]??0}
  function openHub(){if(opened)return;opened=true;trailClock();document.documentElement.classList.add('hub-open');hub.classList.toggle('is-calm',calm());gsap.set(hub,{autoAlpha:1});configureDrag();if(qp.get('unlocked')==='1'){[0,1,2].forEach(i=>examined.add(i));revealGhost(true)}select(initialIndex(),{user:qp.get('hub')!=='1'});if(!calm())gsap.fromTo([$('#hubHeader'),...locs,$('#hubIndex'),$('#back')],{opacity:0,y:5},{opacity:1,y:0,duration:.3,stagger:.06,ease:'power3.out'})}

  const strips=new Set(),placed=new Set();let picked=null;
  const diagram='<path d="M9 48 C48 43 113 37 181 28 M75 43 C58 23 74 7 96 12 C123 16 126 43 105 52 C85 63 65 45 73 28 C77 20 84 17 92 17 M91 12 L100 17 L90 21"/>';
  let diagramDialog;
  function enlargeDiagram(){
    if(!trail.aligned)return;
    if(!diagramDialog){diagramDialog=document.createElement('dialog');diagramDialog.className='gesture-diagram-dialog';diagramDialog.setAttribute('aria-label','Aligned loop gesture diagram');diagramDialog.innerHTML=`<button type="button" aria-label="Close enlarged diagram"><svg viewBox="0 0 190 66" aria-hidden="true"><path class="paper-fold" d="M0 22H190 M0 44H190"/>${diagram}</svg></button>`;document.body.append(diagramDialog);diagramDialog.querySelector('button').onclick=()=>diagramDialog.close();diagramDialog.addEventListener('click',e=>{if(e.target===diagramDialog)diagramDialog.close()});}
    diagramDialog.showModal();diagramDialog.querySelector('button').focus();
  }
  function placeStrip(i){const el=$('#stripPiece'+i);if(!el)return;placed.add(i);el.classList.add('registered');el.style.left='0px';el.style.top=(i*22)+'px';el.setAttribute('aria-pressed','true');picked=null;$('#stripWorkbench').classList.remove('holding');if(placed.size===3){trail.aligned=true;$('#stripWorkbench').classList.add('aligned')}}
  $('#graphiteStrip').addEventListener('click',()=>{if(strips.has(cur)||hub.dataset.phase!=='settled')return;const i=cur;strips.add(i);$('#graphiteStrip').hidden=true;const el=document.createElement('button');el.type='button';el.id='stripPiece'+i;el.className='strip-piece strip-'+CONFIG[i].file;el.setAttribute('aria-label','Graphite strip '+CONFIG[i].name);el.setAttribute('aria-pressed','false');el.innerHTML=`<svg viewBox="0 ${i*22} 190 22" aria-hidden="true">${diagram}</svg>`;el.style.left=(12+i*7)+'px';el.style.top=(6+i*27)+'px';$('#stripWorkbench').hidden=false;$('#stripWorkbench').append(el);el.focus({preventScroll:true});
    el.addEventListener('click',()=>{if(el.dataset.dragged==='1'){el.dataset.dragged='0';return}if(placed.has(i)){enlargeDiagram();return}picked=i;$('#stripWorkbench').classList.add('holding');el.focus()});
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(trail.aligned)enlargeDiagram();else placeStrip(i)}});
    let dragStart;el.addEventListener('pointerdown',e=>{if(placed.has(i))return;dragStart={x:e.clientX,y:e.clientY,left:parseFloat(el.style.left),top:parseFloat(el.style.top)};el.setPointerCapture(e.pointerId)});
    el.addEventListener('pointermove',e=>{if(!dragStart)return;const scale=$('#stripWorkbench').getBoundingClientRect().width/$('#stripWorkbench').offsetWidth,dx=(e.clientX-dragStart.x)/scale,dy=(e.clientY-dragStart.y)/scale;if(Math.abs(dx)+Math.abs(dy)>4)el.dataset.dragged='1';el.style.left=Math.max(-12,Math.min(40,dragStart.left+dx))+'px';el.style.top=Math.max(-8,Math.min(85,dragStart.top+dy))+'px'});
    el.addEventListener('pointerup',()=>{if(!dragStart)return;dragStart=null;if(el.dataset.dragged==='1'&&Math.abs(parseFloat(el.style.left))<20&&Math.abs(parseFloat(el.style.top)-i*22)<16)placeStrip(i)});el.addEventListener('pointercancel',()=>dragStart=null);
  });
  $('#stripRegister').addEventListener('click',()=>{if(picked!==null)placeStrip(picked);else enlargeDiagram()});
  $('#dMod').addEventListener('click',()=>{if(hub.dataset.phase!=='settled'||window.BB.finaleActive)return;trail.modified??=CONFIG[cur].name;record('MODIFIED',CONFIG[cur].name);clearTimeout(clueTimer);$('#openedClue').textContent=`OPENED ${clock(openedAt)}`;$('#openedClue').setAttribute('aria-hidden','false');gsap.to($('#openedClue'),{opacity:1,duration:calm()?0:.12});clueTimer=setTimeout(()=>{gsap.to($('#openedClue'),{opacity:0,duration:calm()?0:.2});$('#openedClue').setAttribute('aria-hidden','true')},3000)});
  $('#cornerLift').addEventListener('click',()=>{const open=paper.classList.toggle('corner-open');$('#cornerLift').setAttribute('aria-pressed',String(open));$('#graphiteStrip').hidden=!open||strips.has(cur);$('#graphiteStrip').dataset.tear=CONFIG[cur].file;const sketch=$('#graphiteStrip svg');sketch.setAttribute('viewBox',`0 ${cur*22} 190 22`);sketch.innerHTML=diagram});
  $('#threadTail').addEventListener('click',()=>{if(unlocked||tugged||window.BB.finaleActive)return;tugged=true;if(calm())return;gsap.timeline({onUpdate:threadTick}).to(rope,{tail:-9,duration:.12,ease:'power2.out'}).to(rope,{tail:0,duration:.2,ease:'sine.out'}).to(rope,{tail:17,duration:.16,ease:'power3.in'},'+=.48').to(rope,{tail:0,duration:.3,ease:'sine.out'})});
  $('#back').addEventListener('click',()=>{const url=new URL(location.href);['hub','still','sel','unlocked'].forEach(k=>url.searchParams.delete(k));location.href=url.href});
  addEventListener('keydown',e=>{if(!opened||window.BB.finaleActive||e.target.closest('#stripWorkbench, #dossier')||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;const f=['ArrowRight','ArrowDown'].includes(e.key),b=['ArrowLeft','ArrowUp'].includes(e.key);if(f||b){e.preventDefault();select((intent+(f?1:2))%3,{user:true})}});
  let swipe,suppress=0;stage.addEventListener('pointerdown',e=>{if(!window.BB.finaleActive&&phoneMQ.matches&&e.isPrimary)swipe={x:e.clientX,y:e.clientY,id:e.pointerId,time:Date.now()}},{passive:true});stage.addEventListener('pointerup',e=>{if(!swipe||e.pointerId!==swipe.id)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y,dt=Date.now()-swipe.time;swipe=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4&&dt<900){suppress=Date.now()+350;select((intent+(dx<0?1:2))%3,{user:true})}},{passive:true});stage.addEventListener('click',e=>{if(Date.now()<suppress){e.preventDefault();e.stopImmediatePropagation()}},true);stage.addEventListener('pointercancel',()=>swipe=null);
  const layers=[[$('#wallCamera'),3,2],[$('#panelParallax'),7,4],[$('#heroParallax'),12,6],[$('#heroShadow'),8,4],...locs.map(e=>[e,7,4]),[$('#hubDust'),17,9]].map(([el,x,y])=>({el,x,y}));
  let px=0,py=0,prev=0,lastThread=0;
  addEventListener('pointermove',e=>{if(!opened||window.BB.finaleActive||touchMQ.matches)return;px=e.clientX/innerWidth-.5;py=e.clientY/innerHeight-.5},{passive:true});hub.addEventListener('pointerleave',()=>{px=py=0});
  gsap.ticker.add(time=>{if(!opened||window.BB.finaleActive||document.hidden||calm())return;const dt=Math.min(.05,time-prev||.016);prev=time;if(touchMQ.matches){px=Math.sin(time*.19)*.12;py=Math.cos(time*.16)*.08}par.x+=(px-par.x)*Math.min(1,dt*3);par.y+=(py-par.y)*Math.min(1,dt*3);layers.forEach(l=>gsap.set(l.el,{x:-par.x*l.x,y:-par.y*l.y}));if(hub.dataset.phase==='settled'&&cur===2)rope.swing=Math.sin(time*1.4)*.13;if(time-lastThread>.032){lastThread=time;updateThread()}});
  // Mobile layout width can change when the entry halves are removed without a window resize.
  new ResizeObserver(scheduleLayout).observe($('#heroLocation'));
  addEventListener('resize',scheduleLayout,{passive:true});phoneMQ.addEventListener('change',()=>{if(opened)configureDrag()});motionMQ.addEventListener('change',()=>{reduced=motionMQ.matches;hub.classList.toggle('is-calm',calm());if(calm()){selectionTL?.kill();ghostTL?.progress(1);reset();layers.forEach(l=>gsap.set(l.el,{x:0,y:0}));if(opened&&intent>=0)select(intent,{refresh:true,record:hub.dataset.phase!=='settled'})}if(opened)configureDrag()});
  // Production assets may be written by the art director while the dev tab is open.
  setInterval(async()=>{if(!opened||window.BB.finaleActive||hub.dataset.phase!=='settled')return;await tryInner();for(let i=0;i<3;i++)if(!art[i].production&&await productionAsset(i)){if(cur===i&&hub.dataset.phase==='settled'){setArt();settled()}}},12000);
  window.BB={...(window.BB||{}),openHub,select,onGhost:beginFinale,getRecorderPortrait:name=>cards[CONFIG.findIndex(p=>p.name===name)]?.img||null,trail:snapshot,setKnot:sourceAt=>{if(!trail.knot){trail.knot=true;record('KNOT','');if(Number.isFinite(sourceAt))trail.events.at(-1).at=Math.round(sourceAt);}},pauseHub:()=>{window.BB.finaleActive=true;trailClock();hub.inert=true;hub.classList.add('finale-paused');clearTimeout(clueTimer);gsap.killTweensOf(rope);ghostTL?.progress(1);suspendedTickers=gsap.ticker._listeners.slice();suspendedTickers.forEach(fn=>gsap.ticker.remove(fn));gsap.ticker.sleep();},resumeHub:()=>{suspendedTickers.forEach(fn=>gsap.ticker.add(fn));suspendedTickers=[];gsap.ticker.wake();window.BB.finaleActive=false;hub.inert=false;hub.classList.remove('finale-paused');trailClock();settled();index[3].focus({preventScroll:true});}};
  if(qp.get('hub')==='1'||qp.get('finale')==='1')addEventListener('load',async()=>{document.querySelector('main').style.display='none';await Promise.all([...art.map(a=>a.ready),...cards.map(c=>c.ready),document.fonts.ready]);openHub();layout();if(qp.get('finale')==='1'){if(qp.get('knot')==='1'){trail.aligned=true;}beginFinale()}});
  document.fonts.ready.then(scheduleLayout);
})();
