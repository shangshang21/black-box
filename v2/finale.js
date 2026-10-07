/* Round 9. Local factual reports, authored fragments, one shared light pass. */
(() => {
  'use strict';
  const BB=window.BB,$=s=>document.querySelector(s),motion=matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>motion.matches;
  const files=['r8-room-plate','r8-human-front','r9-rear-lit','r9-stamp-luna','r9-stamp-hound','r9-stamp-smith','r9-light-paper.svg'];
  let assets,loading,root,canvas,ctx,lit,litCtx,ambient,ambientCtx,aperture,apCtx,rear,rearCtx,w=0,h=0,dpr=1,phone=false;
  let phase='idle',trail,frame=0,last=0,cutAt=0,elapsed=0,acquired=0,pull=0,light={x:0,y:0,tx:0,ty:0},knot=false;
  let session=0,knotAt=null,pool=[],lastMember='',opened=0,points=[],active=null,retiring=[],acks=[],nextPoint=1.4,remembered=[],tension=0,endingDone=false,serial=0,par={x:0,y:0,tx:0,ty:0};
  let audio,master,hum;
  let gesture=[],gestureId=null,knotU=.43,knotAge=1,traceUntil=0;
  const canTie=()=>!knot&&!endingDone&&['search','pull','reports','reveal'].includes(phase);
  let wholeMask={key:'',canvas:null};
  const lightMasks=Array.from({length:6},()=>({size:'',entries:new Map()}));
  function roomTone(){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();master=audio.createGain();master.gain.value=.009;master.connect(audio.destination);hum=audio.createOscillator();hum.frequency.value=48;hum.connect(master);hum.start()}catch{}}
  function clickSound(){if(!audio||!master)return;try{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime;o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(60,t+.06);g.gain.setValueAtTime(2,t);g.gain.exponentialRampToValueAtTime(.001,t+.065);o.connect(g);g.connect(master);o.start();o.stop(t+.07)}catch{}}
  function silence(){try{if(master){master.gain.cancelScheduledValues(audio.currentTime);master.gain.setValueAtTime(master.gain.value,audio.currentTime);master.gain.linearRampToValueAtTime(0,audio.currentTime+.008);hum?.stop(audio.currentTime+.009)}master=null;hum=null}catch{}}
  const preload=()=>loading||(loading=Promise.all(files.map(name=>new Promise((resolve,reject)=>{const im=new Image();im.decoding='async';im.onload=async()=>{try{await im.decode()}catch{}resolve(im)};im.onerror=()=>reject(new Error(name));im.src=`assets/${name}${name.endsWith('.svg')?'':'.webp'}`}))).then(async a=>{const plate=document.createElement('canvas');plate.width=880;plate.height=400;plate.getContext('2d').drawImage(a[6],0,0,880,400);const face=new Image();face.src=plate.toDataURL();await face.decode();a[6]=face;return assets=a}).catch(e=>{loading=null;throw e}));
  function build(){
    if(root)return;
    root=document.createElement('section');root.style.setProperty('--paper-face',`url("${assets[6].src}")`);root.id='finale';root.className='finale';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','The other end of the thread');
    root.innerHTML=`<canvas id="searchRoom" class="search-room" aria-hidden="true"></canvas>
      <div id="reportField" class="report-field" hidden></div>
      <div class="finale-meta"><span class="finale-cross">+</span><span id="finaleLabel">SEARCH</span><span class="finale-ref">CASE_FILE.DAT / 04</span></div>
      <button class="finale-search finale-control" id="findHuman" type="button" aria-label="Search for the human">SEARCH<span aria-hidden="true">↗</span></button>
      <button class="thread-knot-control" id="tieThreadKnot" type="button" aria-label="Tie knot on thread"></button>
      <div class="finale-result" id="finaleResult" tabindex="-1"><p id="finalLine" lang="zh-CN"></p></div>
      <button class="finale-skip finale-control" id="finaleSkip" type="button">SKIP<span aria-hidden="true">/</span></button>
      <button class="finale-exit finale-control" id="finaleExit" type="button">EXIT<span aria-hidden="true">↗</span></button>
      <div class="sr-only" id="reportTranscript"></div><p class="sr-only" id="finaleAnnounce" role="status" aria-live="polite"></p>`;
    document.body.append(root);canvas=$('#searchRoom');ctx=canvas.getContext('2d',{alpha:false});
    [lit,ambient,aperture,rear]=Array.from({length:4},()=>document.createElement('canvas'));litCtx=lit.getContext('2d');ambientCtx=ambient.getContext('2d');apCtx=aperture.getContext('2d');rearCtx=rear.getContext('2d');
    $('#findHuman').onclick=()=>{if(phase==='search'){light.tx=w*(phone?.60:.65);light.ty=h*(phone?.40:.31);acquired=.45;acquire()}};
    $('#finaleSkip').onclick=()=>stop(true);$('#finaleExit').onclick=exit;
    let touching=false;
    function point(e){if(phase!=='search')return;light.tx=Math.max(0,Math.min(w,e.clientX));light.ty=Math.max(0,Math.min(h,e.clientY));if(reduced()){light.x=light.tx;light.y=light.ty;}}
    canvas.addEventListener('pointerdown',e=>{touching=true;canvas.setPointerCapture(e.pointerId);point(e)});
    canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||touching)point(e)},{passive:true});
    canvas.addEventListener('pointerup',()=>touching=false);canvas.addEventListener('pointercancel',()=>touching=false);
    $('#tieThreadKnot').onclick=()=>tieKnot(.43);
    root.addEventListener('pointerdown',e=>{if(e.isPrimary===false){gesture=[];gestureId=null;return;}if(!canTie()||e.button!==0||e.target.closest('button'))return;gesture=[];gestureId=e.pointerId;sampleGesture(e);},{passive:true});
    root.addEventListener('pointermove',e=>{if(e.isPrimary===false)return;if(e.pointerType==='mouse'||gestureId===e.pointerId)sampleGesture(e);},{passive:true});
    root.addEventListener('pointerup',e=>{if(gestureId!==e.pointerId)return;sampleGesture(e);gestureId=null;if(!knot)gesture=[];},{passive:true});
    root.addEventListener('pointercancel',()=>{gestureId=null;gesture=[];});
    root.addEventListener('pointerleave',()=>{gestureId=null;if(!knot)gesture=[];});
    root.addEventListener('pointermove',e=>{if(phase!=='reports'||reduced()||e.pointerType!=='mouse')return;par.tx=(e.clientX/w-.5)*3;par.ty=(e.clientY/h-.5)*2},{passive:true});
    root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(active)dismiss();else exit();return}if(e.key==='Tab'){const targets=[...root.querySelectorAll('button:not([hidden]):not(:disabled)')].filter(el=>el.getClientRects().length);const first=targets[0],end=targets.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===root||document.activeElement===$('#finaleResult'))){e.preventDefault();end?.focus()}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first?.focus()}return}if(phase==='search'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();light.tx=Math.max(0,Math.min(w,light.tx+(e.key==='ArrowLeft'?-45:e.key==='ArrowRight'?45:0)));light.ty=Math.max(0,Math.min(h,light.ty+(e.key==='ArrowUp'?-45:e.key==='ArrowDown'?45:0)));}});
  }
  function cover(context,img){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);context.drawImage(img,(w-img.naturalWidth*scale)*.5,(h-img.naturalHeight*scale)*.5,img.naturalWidth*scale,img.naturalHeight*scale)}
  function humanRect(){const height=h*(phone?.62:.80),width=height*assets[1].naturalWidth/assets[1].naturalHeight;return{x:w*(phone?.60:.65)-width*.5,y:h*(phone?.22:.11),width,height}}
  // Both rendering and recognition use this same sampled thread, from floor to hand.
  function threadPolyline(rearShot=false){
    let start,curves;
    if(rearShot){const p=rearXY(.32,.73),floor=rearXY(.31,.84),end=rearXY(.33,.70);if(phone){const shift=rearHandShift();p.x+=shift;floor.x+=shift;end.x+=shift;}
      start={x:-20,y:h*.97};curves=[[{x:w*.12,y:h*.93},{x:floor.x-55,y:floor.y+22},floor],[{x:floor.x+55*(1-tension),y:floor.y-15},{x:p.x-30*(1-tension),y:p.y+45},{x:p.x,y:p.y-tension*3}],[{x:p.x+7,y:p.y-13},{x:p.x+7,y:p.y-13},end]];
    }else{const r=humanRect(),hand={x:r.x+r.width*.563,y:r.y+r.height*.491-pull*8},floor={x:w*(phone?.26:.28),y:h*.85};
      start={x:w*.035,y:h*1.02};curves=[[{x:w*.12,y:h*.96},{x:floor.x-30,y:floor.y+22},floor],[{x:w*.52,y:h*.86-pull*14},{x:hand.x-18,y:hand.y+90-pull*30},hand],[{x:hand.x+14,y:hand.y+40-pull*20},{x:hand.x+21,y:hand.y+12},{x:hand.x+10,y:hand.y+4}]];
    }
    const pts=[start];let origin=start;
    for(const [a,b,end] of curves){for(let i=1;i<=40;i++){const t=i/40,q=1-t;pts.push({x:q*q*q*origin.x+3*q*q*t*a.x+3*q*t*t*b.x+t*t*t*end.x,y:q*q*q*origin.y+3*q*q*t*a.y+3*q*t*t*b.y+t*t*t*end.y});}origin=end;}
    // Arc position persists across the camera cut and resizing.
    let length=0;pts.forEach((p,i)=>{if(i)length+=Math.hypot(p.x-pts[i-1].x,p.y-pts[i-1].y);p.u=length;});pts.forEach(p=>p.u/=length);return pts;
  }
  function threadAt(pts,u){let i=pts.findIndex(p=>p.u>=u);if(i<1)i=1;const a=pts[i-1],b=pts[i],t=(u-a.u)/(b.u-a.u);return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)};}
  function strokeThread(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();if(!knot)return;
    const p=threadAt(pts,knotU),t=reduced()?1:Math.min(1,knotAge/.35),ease=1-(1-t)**3,scale=1+(1-ease)*1.8;
    c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.scale(scale,scale);c.lineWidth=phone?1.45:1.8;c.beginPath();c.moveTo(-8,0);c.bezierCurveTo(-5,-8,7,-7,6,0);c.bezierCurveTo(5,7,-6,7,-4,-1);c.bezierCurveTo(-2,-5,5,-3,8,0);c.stroke();c.strokeStyle='#e34246';c.lineWidth=.7;c.beginPath();c.moveTo(-2,-3);c.lineTo(3,3);c.stroke();c.restore();
  }
  function threadPath(c){strokeThread(c,threadPolyline());}
  function segmentCross(a,b,c,d){const dx=b.x-a.x,dy=b.y-a.y,ex=d.x-c.x,ey=d.y-c.y,det=dx*ey-dy*ex;if(Math.abs(det)<.001)return null;const x=c.x-a.x,y=c.y-a.y,t=(x*ey-y*ex)/det,u=(x*dy-y*dx)/det;return t>=0&&t<=1&&u>=0&&u<=1?{x:a.x+t*dx,y:a.y+t*dy,t,u}:null;}
  function curveStats(pts){let length=0,turn=0,bend=0,area=0;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];length+=Math.hypot(b.x-a.x,b.y-a.y);area+=a.x*b.y-b.x*a.y;if(i>1){const p=pts[i-2],angle=Math.atan2((a.x-p.x)*(b.y-a.y)-(a.y-p.y)*(b.x-a.x),(a.x-p.x)*(b.x-a.x)+(a.y-p.y)*(b.y-a.y));turn+=angle;bend+=Math.abs(angle);}}if(pts.length>1){const first=pts[0],last=pts.at(-1);area+=last.x*first.y-first.x*last.y;}return{length,turn,bend,area:Math.abs(area)/2};}
  function loopCrossing(pts){
    if(pts.length<12)return null;const last=pts.at(-1),thread=threadPolyline(['reports','reveal'].includes(phase));
    for(let start=0;start<pts.length-10;start++){
      const first=pts[start];if(last.at-first.at>1500)continue;
      const loop=pts.slice(start),xs=loop.map(p=>p.x),ys=loop.map(p=>p.y),width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys),diameter=Math.max(width,height);
      if(diameter<28||diameter>252||Math.min(width,height)/diameter<.42)continue;
      // Permit a near-closed circle or an actual overdrawn/self-crossing loop.
      const crossed=segmentCross(pts.at(-2),last,first,pts[start+1]);
      if(!crossed&&Math.hypot(last.x-first.x,last.y-first.y)>Math.min(14,diameter*.18))continue;
      const stat=curveStats(loop);if(Math.abs(stat.turn)<4.7||Math.abs(stat.turn)/stat.bend<.72||stat.area/(width*height)<.42||stat.length/diameter<2.35||stat.length/diameter>5.6)continue;
      for(let i=1;i<loop.length;i++)for(let j=1;j<thread.length;j++){const hit=segmentCross(loop[i-1],loop[i],thread[j-1],thread[j]);if(hit&&hit.x>=0&&hit.x<=w&&hit.y>=0&&hit.y<=h)return thread[j-1].u+(thread[j].u-thread[j-1].u)*hit.u;}
    }
    return null;
  }
  function sampleGesture(e){
    if(!canTie()||e.target.closest('button')){if(!knot)gesture=[];return;}const now=performance.now();gesture=gesture.filter(p=>now-p.at<=1500);
    const last=gesture.at(-1),distance=last?Math.hypot(last.x-e.clientX,last.y-e.clientY):0;if(last&&distance<3)return;if(distance>60)gesture=[];
    gesture.push({x:e.clientX,y:e.clientY,at:now});if(gesture.length>220)gesture.shift();const u=loopCrossing(gesture);if(u!==null)tieKnot(u);
  }
  function tieKnot(u){if(!canTie())return;knot=true;knotU=u;knotAge=0;knotAt=session+Math.max(0,(performance.now()-last)/1000);traceUntil=performance.now()+250;BB.setKnot(knotAt);window.SFX?.snap?.(.10);
    if(phase==='reports'||phase==='reveal'){if(phase==='reveal'){phase='reports';elapsed=0;root.dataset.phase=phase;$('#finaleSkip').hidden=false;nextPoint=1.2;}const pending=pool.find(p=>p.member==='SMITH'&&p.copy==='汇报完毕');if(pending){pending.copy='线上多了一个结';pending.source=knotAt;}else pool.push({member:'SMITH',copy:'线上多了一个结',source:knotAt});
      // An already waiting final point now carries the newly earned fact first.
      points.forEach(p=>{p.ending=false;p.el.classList.remove('ending-point');p.el.setAttribute('aria-label','Open report');});
    }else drawLit();updateKnotControl();
  }
  function drawGesture(){if(!gesture.length)return;const now=performance.now();if(knot&&now>traceUntil){gesture=[];return;}if(!knot&&!canTie()){gesture=[];return;}if(!knot&&now-gesture.at(-1).at>200)return;const stat=curveStats(gesture);if(stat.length<=40||stat.bend<1.6||Math.abs(stat.turn)/stat.bend<.65)return;
    ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle=`rgba(231,229,211,${knot?.18*Math.max(0,(traceUntil-now)/250):.18})`;ctx.lineWidth=1;ctx.lineCap='round';ctx.beginPath();gesture.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();
  }
  function updateKnotControl(){const el=$('#tieThreadKnot');el.hidden=!canTie();if(el.hidden)return;const p=threadAt(threadPolyline(['reports','reveal'].includes(phase)),.43);el.style.left=(p.x-24)+'px';el.style.top=(p.y-24)+'px';}
  // A graphite hand, using slightly uneven strokes rather than typeset wall copy.
  const chalkGlyphs={O:'M3 0 Q0 0 0 5 Q0 10 3 10 Q6 10 6 5 Q6 0 3 0',P:'M0 10V0H3Q7 0 6 3Q6 5 0 5',E:'M6 0H0V10H6 M0 5H5',N:'M0 10V0L6 10V0',D:'M0 10V0H2Q7 0 6 5Q7 10 0 10',H:'M0 0V10 M6 0V10 M0 5H6',U:'M0 0V7Q0 11 3 10Q6 10 6 7V0',L:'M0 0V10H6',A:'M0 10L3 0L6 10 M1 6H5',S:'M6 1Q0 -2 0 3Q0 5 3 5Q7 5 6 8Q6 11 0 9',M:'M0 10V0L3 5L6 0V10',I:'M0 0H6 M3 0V10 M0 10H6',T:'M0 0H6 M3 0V10','0':'M3 0Q0 0 0 5Q0 10 3 10Q6 10 6 5Q6 0 3 0 M1 8L5 2','1':'M1 2L3 0V10 M0 10H6',':':'M3 3L3.3 3 M3 7L3.3 7'};
  function wallScrawl(c,text){
    const cap=phone?17:Math.max(20,Math.min(34,w*.02125)),unit=cap/10;
    c.save();c.translate(w*(phone?.09:.22),h*(phone?.22:.39));c.rotate(-.045);c.strokeStyle='#c0bcab';c.lineCap='round';c.lineJoin='round';
    [...text].forEach((char,i)=>{if(!chalkGlyphs[char])return;c.save();c.translate(i*unit*8.5,Math.sin(i*13)*unit*.35);c.transform(unit,0,-unit*.12,unit,0,-cap);c.rotate(Math.sin(i*17)*.025);c.lineWidth=.48;c.stroke(new Path2D(chalkGlyphs[char]));c.globalAlpha=.24;c.translate(.3,-.2);c.lineWidth=.25;c.stroke(new Path2D(chalkGlyphs[char]));c.restore()});c.restore();
  }
  function drawLit(){
    if(!assets||!w)return;const c=litCtx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);cover(c,assets[0]);const r=humanRect();
    c.fillStyle='#000a';c.beginPath();c.ellipse(r.x+r.width*.5,r.y+r.height*.96,r.width*.38,8,0,0,Math.PI*2);c.fill();
    c.save();if(pull>0&&!reduced()){c.beginPath();c.rect(0,0,w,h);c.rect(r.x+r.width*.515,r.y+r.height*.425,r.width*.115,r.height*.08);c.clip('evenodd')}c.drawImage(assets[1],r.x,r.y,r.width,r.height);c.restore();
    // Registered cuff patch moves one palm-length while the body stays still.
    if(pull>0&&!reduced()){const im=assets[1],sx=im.naturalWidth*.51,sy=im.naturalHeight*.425,sw=im.naturalWidth*.12,sh=im.naturalHeight*.08;c.drawImage(im,sx,sy,sw,sh,r.x+r.width*.51,r.y+r.height*.425-pull*8,r.width*.12,r.height*.08)}
    c.strokeStyle='#d11220';c.lineWidth=phone?1.45:1.8;threadPath(c);
    ambientCtx.setTransform(1,0,0,1,0,0);ambientCtx.clearRect(0,0,ambient.width,ambient.height);ambientCtx.drawImage(lit,0,0);
    // These facts belong exclusively to the shared lit surface, never the ambient copy.
    c.fillStyle='#77222b';
    [.43,.48].forEach((x,i)=>{c.beginPath();c.ellipse(r.x+r.width*x,r.y+r.height*(i?.088:.098),Math.max(1.1,r.height*.0024),Math.max(.65,r.height*.0015),-.35,0,7);c.fill()});
    if(trail.firstShown)wallScrawl(c,`OPENED 01: ${trail.firstShown}`);

  }
  function renderRoom(){const c=ctx;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#030303';c.fillRect(0,0,w,h);c.globalAlpha=.045;c.drawImage(ambient,0,0,w,h);c.globalAlpha=1;const a=apCtx;a.setTransform(1,0,0,1,0,0);a.clearRect(0,0,aperture.width,aperture.height);a.globalCompositeOperation='source-over';a.drawImage(lit,0,0);a.globalCompositeOperation='destination-in';a.save();a.setTransform(dpr,0,0,dpr,0,0);a.translate(light.x,light.y);a.rotate(-.28);a.scale(1,1.28);const radius=phone?Math.min(230,w*.65):Math.max(170,w*.19);const g=a.createRadialGradient(0,0,0,0,0,radius);g.addColorStop(0,'#fffffff2');g.addColorStop(.38,'#ffffffdd');g.addColorStop(.72,'#ffffff68');g.addColorStop(1,'#ffffff00');a.fillStyle=g;a.fillRect(-radius,-radius,radius*2,radius*2);a.restore();a.globalCompositeOperation='source-over';c.drawImage(aperture,0,0,w,h);
    drawGesture();updateKnotControl();
  }
  function acquire(){if(phase!=='search')return;clickSound();phase='pull';root.dataset.phase=phase;elapsed=0;$('#findHuman').hidden=true;$('#tieThreadKnot').hidden=true;light.tx=humanRect().x+humanRect().width*.56;light.ty=humanRect().y+humanRect().height*(phone?.35:.25);$('#finaleAnnounce').textContent='Human found.';}


  function resize(){if(!root||root.hidden)return;w=innerWidth;h=innerHeight;phone=h>w&&(w<761||matchMedia('(hover:none)').matches);dpr=Math.min(devicePixelRatio,phone?1.5:1);for(const c of [canvas,lit,ambient,aperture,rear]){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr)}canvas.style.width=w+'px';canvas.style.height=h+'px';root.classList.toggle('portrait',phone);light.x=light.tx=Math.min(w,light.tx||w*.34);light.y=light.ty=Math.min(h,light.ty||h*.83);drawLit();drawRear();layoutReports();if(phase==='search'||phase==='pull')renderRoom();else if(phase!=='cut')renderRear();}
  function rearRect(){
    const im=assets[2],scale=phone?Math.min(w*2.2/im.naturalWidth,h*.76/im.naturalHeight):Math.max(w/im.naturalWidth,h/im.naturalHeight),width=im.naturalWidth*scale,height=im.naturalHeight*scale;
    return phone?{x:w*.55-width*.5,y:h*.18+(h*.76-height)*.5,width,height}:{x:(w-width)*.5,y:(h-height)*.5,width,height};
  }
  function rearHandShift(){const r=rearRect();return phone?w*.22-(r.x+r.width*.25):0;}
  function rearXY(x,y){const r=rearRect();return{x:r.x+r.width*x,y:r.y+r.height*y};}
  function drawRear(){if(!assets||!w)return;rearCtx.setTransform(dpr,0,0,dpr,0,0);rearCtx.clearRect(0,0,w,h);const r=rearRect();const im=assets[2],sx=im.naturalWidth*.25,sy=im.naturalHeight*.67,sw=im.naturalWidth*.14,sh=im.naturalHeight*.15;
    if(phone||(tension>0&&!reduced())){rearCtx.save();rearCtx.beginPath();rearCtx.rect(0,0,w,h);rearCtx.rect(r.x+r.width*.25,r.y+r.height*.67,r.width*.14,r.height*.15);rearCtx.clip('evenodd');rearCtx.drawImage(im,r.x,r.y,r.width,r.height);rearCtx.restore();rearCtx.drawImage(im,sx,sy,sw,sh,r.x+r.width*.25+rearHandShift()+(reduced()?0:tension*2),r.y+r.height*.67-(reduced()?0:tension*2),r.width*.14,r.height*.15);}else rearCtx.drawImage(im,r.x,r.y,r.width,r.height);}

  // Note edges and body regions share one registration. A wide grazing aperture
  // provides context; distance from the paper controls brightness inside it.
  const fragments=[
    {body:[.66,.25,.19,.34],note:[.61,.26],gain:1},
    {body:[.35,.75,.26,.22],note:[.45,.43],gain:1},
    {body:[.49,.73,.25,.22],note:[.55,.42],gain:.72},
    {body:[.73,.43,.23,.28],note:[.68,.35],gain:.68},
    {body:[.85,.78,.22,.30],note:[.90,.58],gain:.40},
    {body:[.66,.37,.21,.25],note:[.63,.29],gain:.80}
  ];
  function fragmentBody(index){let [x,y,rx,ry]=fragments[index%6].body;
    if(phone){if(index%6===1){rx=.22;ry=.24;}if(index%6===3){x=.69;y=.50;rx=.19;ry=.29;}if(index%6===4){x=.70;y=.78;rx=.16;ry=.32;}}
    const p=rearXY(x,y),r=rearRect();if(phone&&index%6===1)p.x+=rearHandShift();return{x:p.x,y:p.y,rx:r.width*rx,ry:r.height*ry};
  }
  function notePosition(index,width,height){const [edge,y]=fragments[index%6].note;
    if(phone)return{left:w*.08,top:h*.27};
    return{left:Math.max(w*.06,Math.min(w-width-w*.045,w*edge-width)),top:Math.max(h*.10,Math.min(h*.70-height,h*y-height*.5))};
  }
  function noteSource(index){const width=phone?w*.84:Math.min(420,Math.max(250,w*.25)),height=phone?174*w/384:Math.max(132,Math.min(184,w*.115));
    const p=notePosition(index,width,height);return{left:p.left,top:p.top,width,height};
  }
  function fragment(c,index,alpha,source){const body=fragmentBody(index),note=source||noteSource(index);
    // Closest point on the paper is the emitter, never the distant fragment centre.
    const x=Math.max(note.left,Math.min(note.left+note.width,body.x)),y=Math.max(note.top,Math.min(note.top+note.height,body.y));
    const near=Math.hypot(x-body.x,y-body.y),radius=Math.max(w*.30,h*.32,near*1.75);
    const outer=c.createRadialGradient(x,y,0,x,y,radius);outer.addColorStop(0,'rgba(255,255,255,1)');outer.addColorStop(.22,'rgba(255,255,255,.92)');outer.addColorStop(.56,'rgba(255,255,255,.48)');outer.addColorStop(1,'rgba(255,255,255,0)');
    c.save();c.translate(body.x+par.x,body.y+par.y);c.scale(body.rx,body.ry);const context=c.createRadialGradient(0,0,0,0,0,1);context.addColorStop(0,`rgba(255,255,255,${alpha})`);context.addColorStop(.30,`rgba(255,255,255,${alpha*.93})`);context.addColorStop(.65,`rgba(255,255,255,${alpha*.42})`);context.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=context;c.fillRect(-1,-1,2,2);c.restore();
    c.globalCompositeOperation='source-in';c.fillStyle=outer;c.fillRect(0,0,w,h);c.globalCompositeOperation='source-over';
  }
  function fragmentMask(index,source){const item=lightMasks[index],scale=phone?1:.65,size=[w,h,phone].join('/'),key=[source.left,source.top,source.width,source.height].join('/');
    if(item.size!==size){item.size=size;item.entries.clear();}
    if(!item.entries.has(key)){const mask=document.createElement('canvas');mask.width=Math.ceil(w*scale);mask.height=Math.ceil(h*scale);const c=mask.getContext('2d');c.setTransform(scale,0,0,scale,0,0);fragment(c,index,1,source);if(item.entries.size>=4)item.entries.clear();item.entries.set(key,mask);}
    return item.entries.get(key);
  }
  function rememberedSource(index){const saved=remembered.find(p=>p.index===index);if(!saved)return noteSource(index);const source=noteSource(index);source.height=source.width*saved.aspect;Object.assign(source,notePosition(index,source.width,source.height));return source;}
  function wholeLight(){
    const sources=fragments.map((f,i)=>rememberedSource(i)),key=JSON.stringify([w,h,phone,sources]);
    if(wholeMask.key!==key){const scale=phone?1:.65,mask=document.createElement('canvas');mask.width=Math.ceil(w*scale);mask.height=Math.ceil(h*scale);const c=mask.getContext('2d');c.setTransform(scale,0,0,scale,0,0);
      sources.forEach((source,i)=>{c.globalAlpha=[.66,.86,.26,.23,.11,.36][i];c.drawImage(fragmentMask(i,source),0,0,w,h)});wholeMask={key,canvas:mask};}
    return wholeMask.canvas;
  }
  function renderRear(){const c=ctx;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#000';c.fillRect(0,0,w,h);const a=apCtx;
    const whole=endingDone||phase==='reveal'||phase==='stop'||phase==='line',strength=phase==='reveal'?Math.min(1,elapsed/.85):1;
    // Union cached directional masks, then illuminate the rear surface once.
    // No grey ambient wash: the cowl and thread hand retain the strongest light.
    const lights=[];
    for(const note of [...retiring,...(active?[active]:[])])lights.push({index:note.fragment,alpha:note.light*fragments[note.fragment].gain,source:note.sourceRect});
    a.setTransform(1,0,0,1,0,0);a.clearRect(0,0,aperture.width,aperture.height);a.setTransform(dpr,0,0,dpr,0,0);a.globalCompositeOperation='source-over';
    if(whole){a.globalAlpha=strength;a.drawImage(wholeLight(),par.x,par.y,w,h);}
    for(const light of lights){a.globalAlpha=light.alpha;a.drawImage(fragmentMask(light.index,light.source),par.x,par.y,w,h);}a.globalAlpha=1;
    a.setTransform(1,0,0,1,0,0);a.globalCompositeOperation='source-in';a.drawImage(rear,par.x*dpr,par.y*dpr);a.globalCompositeOperation='source-over';c.drawImage(aperture,0,0,w,h);drawRearThread(c);drawAcks();
  }
  // The existing canvas acknowledges input before a new paper layer is rasterized.
  function drawAcks(){ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);for(const mark of acks){const alpha=.8*Math.max(0,1-mark.age/.12),g=ctx.createRadialGradient(mark.x,mark.y,0,mark.x,mark.y,15);g.addColorStop(0,`rgba(255,254,243,${alpha})`);g.addColorStop(.18,`rgba(255,254,243,${alpha})`);g.addColorStop(.45,`rgba(255,254,243,${alpha*.2})`);g.addColorStop(1,'rgba(255,254,243,0)');ctx.fillStyle=g;ctx.fillRect(mark.x-15,mark.y-15,30,30);}ctx.restore();}
  function drawRearThread(c){c.save();c.strokeStyle='#d01622';c.lineWidth=phone?1.35:1.7;c.lineCap='round';strokeThread(c,threadPolyline(true));c.restore();drawGesture();updateKnotControl();}
  const clock=s=>`${Math.floor(Math.abs(s)/60).toString().padStart(2,'0')}:${(Math.abs(s)%60).toString().padStart(2,'0')}`;
  const stampTime=source=>{const t=Math.round(source)-3;return `SESSION T${t<0?'−':'+'}${clock(t)}`};
  function preparePool(){const events=Array.isArray(trail.events)?trail.events:null,first=events?.find(e=>['DISPLAY','REPEAT'].includes(e.type)),modified=events?.find(e=>e.type==='MODIFIED'),repeat=events?.find(e=>e.type==='REPEAT'),count=new Set(events?.filter(e=>['DISPLAY','REPEAT'].includes(e.type)).map(e=>e.name)||[]).size,boundary=session;
    pool=[{member:'HOUND',copy:first?`先出场的是 ${first.name}`:'汇报到位',source:first?.at},
      {member:'LUNA',copy:Number.isFinite(trail.activeSeconds)?`他在线 ${Math.floor(trail.activeSeconds/60)}:${String(trail.activeSeconds%60).padStart(2,'0')}`:'汇报就绪',source:Number.isFinite(trail.activeSeconds)?boundary:undefined},
      {member:'SMITH',copy:modified?`MODIFIED：${modified.name}`:events?'MODIFIED：无记录':'待命',source:modified?.at??(events?boundary:undefined)},
      {member:'HOUND',copy:repeat?`又见到 ${repeat.name} 了`:count?`${count} 份档案都露面了`:'汇报到位',source:repeat?.at??(count?boundary:undefined)},
      {member:'LUNA',copy:'这条已显示'},
      {member:'SMITH',copy:knot?'线上多了一个结':'汇报完毕',source:knot?(knotAt??events?.find(e=>e.type==='KNOT')?.at):undefined}];
    // Shuffle all six speaker turns; preserve each member's factual order.
    const queues=Object.fromEntries(['HOUND','LUNA','SMITH'].map(n=>[n,pool.filter(p=>p.member===n)]));
    let turns;do{turns=['HOUND','HOUND','LUNA','LUNA','SMITH','SMITH'];for(let i=turns.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[turns[i],turns[j]]=[turns[j],turns[i]]}}while(turns.some((n,i)=>i&&n===turns[i-1]));
    pool=turns.map(n=>queues[n].shift());
  }
  const sockets=[[.33,.35],[.14,.48],[.48,.22],[.57,.46],[.20,.20],[.46,.51]];
  function layoutReports(){
    let bounds;if(active){const el=active.el,p=notePosition(active.fragment,el.offsetWidth,el.offsetHeight);el.style.left=p.left+'px';el.style.top=p.top+'px';
      active.sourceRect={left:p.left,top:p.top,width:el.offsetWidth,height:el.offsetHeight};
      const origin=active.origin||{x:p.left+el.offsetWidth*.5,y:p.top+el.offsetHeight*.5};
      el.style.transformOrigin=`${origin.x-p.left}px ${origin.y-p.top}px`;
      const tilt=phone?0:[4,-3,2,-4,-2,3][active.fragment];el.style.setProperty('--tilt',`${tilt}deg`);
      const stamp=el.querySelector('.note-stamp');el.style.setProperty('--stamp-bottom',`${-4-Math.tan(tilt*Math.PI/180)*(el.offsetWidth*.5-9-stamp.offsetWidth*.5)}px`);
      bounds={left:p.left-40,right:p.left+el.offsetWidth+40,top:p.top-40,bottom:p.top+el.offsetHeight+40};}
    const upper=[[.12,.12],[.35,.10],[.56,.12],[.79,.16],[.90,.35],[.70,.39]];
    for(const point of points){if(point.arming&&point.origin){point.el.style.left=point.origin.x+'px';point.el.style.top=point.origin.y+'px';continue;}let [x,y]=sockets[point.socket];if(phone){x=.14+(point.socket%3)*.30;y=.12+Math.floor(point.socket/3)*.06;}else if(bounds&&x*w>bounds.left&&x*w<bounds.right&&y*h>bounds.top&&y*h<bounds.bottom){[x,y]=upper[point.socket];}point.el.style.left=x*w+'px';point.el.style.top=y*h+'px';}
  }
  // Pointer activation has one owner; native keyboard/assistive clicks remain valid.
  function press(el,action){
    el.addEventListener('pointerdown',e=>{if(e.button!==0||e.isPrimary===false)return;e.preventDefault();el.classList.add('input-pop');action();});
    el.addEventListener('click',e=>{if(e.detail===0)action();});
  }
  function clearNotes(){acks=[];active?.el.remove();active=null;retiring.forEach(note=>note.el.remove());retiring=[];}
  function spawnPoint(){if(points.length>=3||phase!=='reports')return;const used=points.map(p=>p.socket),choices=sockets.map((_,i)=>i).filter(i=>!used.includes(i)&&i!==active?.socket),socket=choices[Math.floor(Math.random()*choices.length)];const isEnding=!endingDone&&!pool.length;const el=document.createElement('button');el.type='button';el.className='message-point'+(isEnding?' ending-point':'');el.setAttribute('aria-label',isEnding?'Open the remaining light':'Open report');const point={el,socket,ending:isEnding};press(el,()=>{if(phase!=='reports')return;if(point.arming){point.arming=false;el.classList.remove('input-pop');return;}point.arming=true;point.origin={x:parseFloat(el.style.left),y:parseFloat(el.style.top)};if(!reduced()){acks.push({x:parseFloat(el.style.left),y:parseFloat(el.style.top),age:0});drawAcks();}if(active)dismiss();requestAnimationFrame(()=>requestAnimationFrame(()=>{if(point.arming){point.arming=false;openPoint(point);}}));});points.push(point);$('#reportField').append(el);layoutReports();}
  function clearPoints(){points.forEach(p=>p.el.remove());points=[];}
  function openPoint(point){if(phase!=='reports'||!points.includes(point))return;const origin=point.origin||{x:parseFloat(point.el.style.left),y:parseFloat(point.el.style.top)};if(active)dismiss();point.el.remove();points=points.filter(p=>p!==point);if(point.ending){clearPoints();phase='reveal';elapsed=0;root.dataset.phase=phase;$('#finaleSkip').hidden=true;return;}
    const report=pool.find(p=>p.member!==lastMember)||{member:['HOUND','LUNA','SMITH'].filter(n=>n!==lastMember)[Math.floor(Math.random()*2)]};if(!report.copy)report.copy={HOUND:'汇报到位',LUNA:'汇报就绪',SMITH:'待命'}[report.member];pool=pool.filter(p=>p!==report);lastMember=report.member;const source=report.source??session,el=document.createElement('button');el.type='button';el.className='light-note input-pop';el.setAttribute('aria-label',`${report.member}. ${stampTime(source)}. ${report.copy} Tap to dismiss`);
    el.innerHTML=`<span class="note-paper" aria-hidden="true"></span><span class="note-chrome"><b>${report.member}</b><small>${stampTime(source)}</small></span><span class="note-copy" lang="zh-CN"></span><img class="note-stamp" src="assets/r9-stamp-${report.member.toLowerCase()}.webp" alt=""><span class="note-specks" aria-hidden="true"></span>`;el.querySelector('.note-copy').textContent=report.copy;
    // Deterministic drifting light grains, confined to the paper edge.
    const specks=el.querySelector('.note-specks');for(let i=0;i<32;i++){const grain=document.createElement('i'),edge=i%4,t=((i*37)%101)/100;grain.style.cssText=`left:${edge===0?-2:edge===1?102:t*100}%;top:${edge===2?-4:edge===3?104:t*100}%;--dx:${edge===0?-12:edge===1?12:(t-.5)*16}px;--dy:${edge===2?-10:edge===3?10:(t-.5)*14}px;--delay:${(i%5)*.025}s;--grain:${i%3===0?1.5:.8}px`;specks.append(grain);}
    active={el,socket:point.socket,origin,fragment:opened%6,light:reduced()?1:.12,age:0,dismissing:false,stamped:false,report,source};opened++;root.dataset.opened=String(opened);press(el,()=>{if(active?.el===el)dismiss();});$('#reportField').append(el);layoutReports();if(opened<=6)remembered.push({index:active.fragment,aspect:el.offsetHeight/el.offsetWidth});el.focus({preventScroll:true});const entry=document.createElement('p');entry.textContent=`${report.member} / ${stampTime(source)} / ${report.copy}`;$('#reportTranscript').append(entry);$('#finaleAnnounce').textContent=report.copy;if(!pool.length&&!endingDone)clearPoints();nextPoint=6+Math.random()*3;renderRear();
  }
  function dismiss(){if(!active||active.dismissing||phase!=='reports')return;active.fadeFrom=active.light;active.dismissing=true;active.age=0;
    const style=getComputedStyle(active.el);active.el.style.setProperty('--collapse-from',style.transform==='none'?'scale(1)':style.transform);active.el.style.setProperty('--collapse-opacity',style.opacity);
    active.el.querySelectorAll('.note-copy,.note-chrome,.note-stamp,.note-specks').forEach(el=>el.style.setProperty('--ink-start',getComputedStyle(el).opacity));
    active.el.style.setProperty('--paper-start',getComputedStyle(active.el.querySelector('.note-paper')).opacity);active.el.getAnimations({subtree:true}).forEach(a=>a.cancel());active.el.classList.add('fading');active.el.disabled=true;active.el.style.setProperty('--fade',reduced()?'.18s':'.55s');retiring.push(active);active=null;layoutReports();$('#finaleExit').focus({preventScroll:true});}
  function reportsStart(){silence();trail=BB.trail();preparePool();phase='reports';elapsed=0;root.dataset.phase=phase;$('#finaleLabel').textContent='';root.querySelector('.finale-meta').hidden=true;$('#reportField').hidden=false;drawRear();renderRear();nextPoint=1.4;}
  function revealLine(){phase='line';elapsed=0;root.dataset.phase=phase;$('#finalLine').textContent=knot?'有意思。':'线的另一端，一直在我手里。';$('#finaleResult').classList.add('visible');$('#finaleResult').focus({preventScroll:true});$('#finaleAnnounce').textContent='';}
  function stop(skipped){if(!root||root.hidden)return;silence();clearPoints();clearNotes();endingDone=true;tension=1;par={x:0,y:0,tx:0,ty:0};$('#findHuman').hidden=true;$('#tieThreadKnot').hidden=true;gesture=[];$('#reportField').hidden=false;root.querySelector('.finale-meta').hidden=true;$('#finaleSkip').hidden=true;canvas.style.opacity='1';phase='stop';elapsed=0;root.dataset.phase=phase;root.classList.add('is-stopped');root.querySelectorAll('*').forEach(el=>el.getAnimations().forEach(a=>a.finish()));drawRear();renderRear();if(skipped){pool=[];revealLine()}}
  function tick(time){frame=0;if(root.hidden||document.hidden)return;const realDt=Math.max(0,(time-last)/1000),dt=Math.min(.05,realDt);last=time;elapsed+=realDt;session+=realDt;knotAge+=dt;acks=acks.filter(mark=>(mark.age+=realDt)<.12);
    retiring=retiring.filter(note=>{note.age+=realDt;note.light=note.fadeFrom*Math.max(0,1-note.age/(reduced()?.18:.55))**1.4;if(note.light===0){note.el.remove();return false}return true;});
    if(phase==='cut'){if(time-cutAt>=140){phase='search';root.dataset.phase=phase;elapsed=0;canvas.style.opacity='1';$('#findHuman').focus({preventScroll:true});if(new URLSearchParams(location.search).get('finale')==='1'&&new URLSearchParams(location.search).get('knot')==='1')tieKnot(.43);}}
    if(phase==='search'||phase==='pull'){light.x+=(light.tx-light.x)*(reduced()?1:Math.min(1,dt*11));light.y+=(light.ty-light.y)*(reduced()?1:Math.min(1,dt*11));if(phase==='search'){const r=humanRect(),targetX=r.x+r.width*.48,targetY=r.y+r.height*.30;if(Math.abs(light.x-targetX)<r.width*.44&&Math.abs(light.y-targetY)<r.height*.21)acquired+=dt;else acquired=Math.max(0,acquired-dt*.4);if(acquired>=.45)acquire()}else{pull=reduced()?0:Math.min(1,elapsed/.5);drawLit();if(elapsed>=(reduced()?.18:.75))reportsStart()}if(phase==='search'&&knot&&knotAge<.4)drawLit();if(phase==='search'||phase==='pull')renderRoom();}
    if(phase==='reports'){par.x+=(par.tx-par.x)*Math.min(1,dt*3);par.y+=(par.ty-par.y)*Math.min(1,dt*3);nextPoint-=realDt;if(nextPoint<=0){spawnPoint();nextPoint=6+Math.random()*3;}if(active){active.age+=realDt;active.light=reduced()?1:.12+.88*(1-(1-Math.min(1,active.age/.40))**4);if(!active.stamped&&active.age>=(reduced()?0:.52)){active.stamped=true;active.el.classList.add('stamped');window.SFX?.thud?.(.025)}if(opened>=6&&active.stamped)wholeLight();}
      renderRear();}
    // Give the immediate press its own paint before rebuilding the moving rear plate.
    if(phase==='reveal'){if(elapsed>=.035){tension=reduced()?1:Math.min(1,elapsed/.85);drawRear();renderRear();}if(elapsed>=.95)stop(false);}
    else if(phase==='stop'&&elapsed>=1)revealLine();
    else if(phase==='line'&&elapsed>=4){phase='reports';root.dataset.phase=phase;root.classList.remove('is-stopped');nextPoint=1.2;}
    frame=requestAnimationFrame(tick);
  }
  async function start(visit){if(root&&!root.hidden)return;await preload();build();trail=visit;knot=!!visit.knot&&Array.isArray(visit.events)&&visit.events.some(e=>e.type==='KNOT');knotAt=null;session=Number.isFinite(visit.activeSeconds)?visit.activeSeconds:0;gesture=[];gestureId=null;knotAge=1;phase='cut';cutAt=performance.now();elapsed=0;acquired=0;pull=0;tension=0;opened=0;pool=[];lastMember='';remembered=[];endingDone=false;par={x:0,y:0,tx:0,ty:0};clearPoints();clearNotes();root.hidden=false;root.dataset.opened='0';root.classList.remove('is-stopped');root.dataset.phase=phase;root.querySelector('.finale-meta').hidden=false;$('#finaleLabel').textContent='SEARCH';canvas.style.opacity='0';$('#reportField').hidden=true;$('#finaleResult').classList.remove('visible');$('#finalLine').textContent='';$('#reportTranscript').replaceChildren();$('#finaleAnnounce').textContent='';$('#findHuman').hidden=false;$('#tieThreadKnot').hidden=true;$('#finaleSkip').hidden=false;BB.pauseHub();roomTone();document.documentElement.classList.add('finale-open');light={x:innerWidth*.34,y:innerHeight*.83,tx:innerWidth*.34,ty:innerHeight*.83};resize();last=performance.now();frame=requestAnimationFrame(tick);}
  function exit(){if(root.hidden)return;gesture=[];gestureId=null;cancelAnimationFrame(frame);frame=0;silence();clearNotes();root.hidden=true;phase='idle';document.documentElement.classList.remove('finale-open');BB.resumeHub();}
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!root||root.hidden)return;if(document.hidden){gesture=[];gestureId=null;audio?.suspend();cancelAnimationFrame(frame);frame=0;root.classList.add('is-paused')}else{if(phase==='search'||phase==='pull')audio?.resume();root.classList.remove('is-paused');last=performance.now();frame=requestAnimationFrame(tick)}});
  motion.addEventListener('change',()=>{if(!root||root.hidden)return;if(reduced()){par={x:0,y:0,tx:0,ty:0};root.querySelectorAll('*').forEach(el=>el.getAnimations().forEach(a=>a.finish()));if(active&&!active.dismissing)active.light=1;}});
  BB.finale={start,preload};
})();
