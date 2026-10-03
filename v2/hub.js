/* The hub owns its timelines and its evidence. The entry remains an independent scene. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const qp = new URLSearchParams(location.search);
  const still = qp.get('still') === '1';
  const motionMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const portraitMQ = matchMedia('(max-width: 760px)');
  const suspects = [
    { no: '01', name: 'LUNA', role: 'EXECUTOR', status: 'ACTIVE', note: '执行者。她最近一次下单，是在三天前。', file: 'luna' },
    { no: '02', name: 'HOUND', role: 'SNIFFER', status: 'ACTIVE', note: '嗅探者。市场上任何风吹草动，都先经过他的鼻子。', file: 'hound' },
    { no: '03', name: '武器大师', role: 'WEAPONSMITH', status: 'DORMANT', note: '休眠，不等于退役。', file: 'smith', zh: true },
    { no: '04', name: 'UNKNOWN', role: '', file: 'ghost' }
  ];
  const hub = $('#hub'), stage = $('#posterStage'), paper = $('#dossier'), dragEl = $('#dossierDrag');
  const locations = [$('#heroLocation'), $('#altLocationA'), $('#altLocationB'), $('#ghostLocation')];
  const bars = [...paper.querySelectorAll('.rb')], stamp = $('#stamp');
  const examined = new Set();
  let opened = false, cur = -1, intent = -1, token = 0, order = [0,1,2], unlocked = false, ghostFastened = false;
  let selectionTL, entranceTL, ghostTL, drag, clueTimer, ghostTimer, resizeFrame, threadFrame;
  let openedAt = 0, reduced = motionMQ.matches, tailTension = 0;
  const calm = () => still || reduced;
  const clock = t => new Date(t).toLocaleTimeString('en-GB', { hour12: false });
  const buttonMarkup = text => `<i class="b-slab"></i><span class="b-face"><i class="b-tri"></i><span class="e-txt">${text}</span></span>`;

  const cards = suspects.map((p,i) => {
    const motion = document.createElement('div'); motion.className = 'poster-motion'; motion.dataset.suspect = i;
    motion.innerHTML = `<div class="poster-paper"><button class="poster-button" type="button" aria-label="Suspect ${p.no}, ${p.name}"><img class="poster-art" src="assets/hub-poster-${p.file}.webp" alt="${i === 3 ? 'Unidentified' : p.name} torn-paper portrait"><span class="poster-label"><span class="poster-number">${p.no}</span><span>${i === 3 ? '<span class="ghost-name"></span><span class="ghost-signal"><i></i><i></i><i></i></span>' : `<span class="poster-name${p.zh ? ' zh' : ''}">${p.name}</span><span class="poster-role">${p.role}</span>`}</span></span></button><i class="poster-tape"></i><i class="poster-tape tape-two"></i><i class="poster-pin"></i></div>`;
    const img = motion.querySelector('img');
    // Aspect ratio comes from the actual decoded art, including replacements supplied during production.
    const ready = new Promise(resolve => {
      const done = () => { if (!img.naturalWidth) { img.classList.add('failed'); img.alt = `${p.no} / ${p.name}`; } resolve(); scheduleLayout(); };
      if (img.complete) done(); else { img.addEventListener('load',done,{once:true}); img.addEventListener('error',done,{once:true}); }
    }).then(async () => { if (img.naturalWidth) try { await img.decode(); } catch {} });
    motion.querySelector('button').addEventListener('click', () => i === 3 ? activateGhost() : select(i, { user: true }));
    return { el: motion, img, ready };
  });
  const index = suspects.map((p,i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hub-b index-button v-b';
    b.innerHTML = buttonMarkup(p.no); b.setAttribute('aria-label', `${p.no} / ${p.name}`); b.setAttribute('aria-pressed','false');
    b.hidden = i === 3; b.addEventListener('click', () => i === 3 ? activateGhost() : select(i,{user:true})); $('#hubIndex').append(b); return b;
  });
  for (let i=0;i<15;i++) {
    const d = document.createElement('i'); d.style.left = `${(i*37+13)%100}%`; d.style.top = `${(i*19+7)%95}%`;
    d.style.animationDelay = `${-i*1.31}s`; d.style.animationDuration = `${17+i%5*3}s`; $('#hubDust').append(d);
  }
  if (window.Draggable && window.InertiaPlugin) gsap.registerPlugin(Draggable, InertiaPlugin);

  function setOrder() {
    order.forEach((i,k) => { locations[k].append(cards[i].el); cards[i].el.querySelector('button').setAttribute('aria-pressed',String(k === 0)); });
    if (unlocked) locations[3].append(cards[3].el);
    fitPosters();
  }
  function fitPosters() {
    locations.forEach(loc => {
      const el = loc.querySelector('.poster-motion'); if (!el || loc.hidden) return;
      const img = el.querySelector('img');
      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth/img.naturalHeight : 1;
      const w = Math.min(loc.clientWidth, loc.clientHeight*ratio);
      el.style.width = `${w}px`; el.style.height = `${w/ratio}px`;
    });
  }
  function point(el) { const r = el.getBoundingClientRect(), h = hub.getBoundingClientRect(); return { x:r.left+r.width/2-h.left, y:r.top+r.height/2-h.top+hub.scrollTop }; }
  const fmt = n => Math.round(n*10)/10;
  function updateThread() {
    if (!opened || cur < 0) return;
    const a = point(locations[0].querySelector('.poster-pin')), b = point(locations[1].querySelector('.poster-pin')), c = point(locations[2].querySelector('.poster-pin'));
    const d = point($('#dPin')), w = hub.clientWidth, h = Math.max(hub.clientHeight, $('#hubFlow').offsetHeight);
    let path, t;
    if (portraitMQ.matches) {
      const right = w-9, y = Math.max(78,Math.min(a.y,b.y,c.y)-12);
      path = `M${a.x} ${a.y} Q${a.x+18} ${y} ${right} ${y+12} L${right} ${d.y-24} Q${right} ${d.y-11} ${d.x} ${d.y}`;
      t = {x:10,y:d.y+87+tailTension};
      path += ` M${d.x} ${d.y} Q9 ${d.y-8} 9 ${d.y+27} Q8 ${d.y+64+tailTension} ${t.x} ${t.y}`;
      if (unlocked && ghostFastened) { const g = point(locations[3].querySelector('.poster-pin')); path += ` M${right} ${y+12} Q${right-7} ${g.y-14} ${g.x} ${g.y}`; }
    } else {
      path = `M${a.x} ${a.y} Q${(a.x+b.x)/2} ${Math.min(a.y,b.y)-22} ${b.x} ${b.y} Q${(b.x+c.x)/2} ${Math.min(b.y,c.y)-13} ${c.x} ${c.y}`;
      const corridor = Math.min(d.y-23, Math.max(b.y,c.y)+locations[2].clientHeight+9);
      path += ` Q${c.x+28} ${corridor-17} ${c.x-10} ${corridor} Q${d.x+90} ${corridor+7} ${d.x} ${d.y}`;
      t = {x:d.x-28,y:d.y+hub.clientHeight*.22+tailTension};
      if (unlocked && ghostFastened) {
        const g=point(locations[3].querySelector('.poster-pin'));
        const outer=Math.max(c.x,g.x)+12;
        path += ` M${d.x} ${d.y} C${d.x+95} ${d.y-26} ${outer-20} ${d.y-28} ${outer-9} ${d.y-17} C${outer+9} ${d.y+3} ${g.x+18} ${g.y-14} ${g.x} ${g.y}`;
      } else path += ` M${d.x} ${d.y} Q${d.x-29} ${d.y+21} ${d.x-25} ${d.y+72} Q${d.x-21} ${t.y-28+tailTension} ${t.x} ${t.y}`;
    }
    $('#strings').setAttribute('viewBox', `0 0 ${w} ${h}`); $('#strings').style.height = `${h}px`;
    $('#threadShadow').setAttribute('d',path); $('#threadCore').setAttribute('d',path);
    const tail=$('#threadTail'); tail.hidden=ghostFastened; tail.style.left=`${fmt(t.x-14)}px`; tail.style.top=`${fmt(t.y-14)}px`;
  }
  function layout() {
    resizeFrame=undefined;
    const s = Math.max(hub.clientWidth/1672,hub.clientHeight/941);
    const wall=$('#wallCamera'); wall.style.width=`${1672*s}px`; wall.style.height=`${941*s}px`;
    wall.style.left=`${(hub.clientWidth-1672*s)/2}px`; wall.style.top=`${(hub.clientHeight-941*s)/2}px`;
    fitPosters();
    const nav=$('#hubIndex'), flow=$('#hubFlow');
    nav.style.top=''; nav.style.bottom=''; flow.style.minHeight=''; hub.classList.remove('is-overflowing');
    if(!portraitMQ.matches) {
      const fileBottom=paper.getBoundingClientRect().bottom-hub.getBoundingClientRect().top+hub.scrollTop;
      const navTop=nav.getBoundingClientRect().top-hub.getBoundingClientRect().top+hub.scrollTop;
      if(fileBottom+20>navTop) {
        nav.style.top=`${fileBottom+28}px`; nav.style.bottom='auto';
        flow.style.minHeight=`${fileBottom+nav.offsetHeight+100}px`; hub.classList.add('is-overflowing');
      }
    }
    updateThread();
    if (drag) {
      gsap.set(dragEl,{x:0,y:0}); drag.update(true);
      const area=$('#evidenceArea');
      drag.applyBounds({ minX:0, maxX:Math.max(0,area.clientWidth-dragEl.offsetWidth-4), minY:0, maxY:Math.max(0,area.clientHeight-dragEl.offsetHeight-12) });
      updateThread();
    }
  }
  function scheduleLayout() { if (opened && !resizeFrame) resizeFrame=requestAnimationFrame(layout); }
  function threadTick() { if (!threadFrame) threadFrame=requestAnimationFrame(() => { threadFrame=undefined; updateThread(); }); }
  function configureDrag() {
    if (drag) { drag.kill(); drag=undefined; }
    gsap.set(dragEl,{x:0,y:0});
    if (!portraitMQ.matches && window.Draggable) {
      drag=Draggable.create(dragEl, {type:'x,y',trigger:$('#dGrip'), inertia:!calm(), edgeResistance:1, dragResistance:.12,
        onDrag:threadTick,onThrowUpdate:threadTick,onDragEnd:threadTick,
        onPress() { paper.classList.add('is-held'); },onRelease() { paper.classList.remove('is-held'); }
      })[0];
    }
    layout();
  }
  function fill(i) {
    const p=suspects[i]; openedAt=Date.now();
    $('#dNo').textContent=`FILE ${p.no}`; $('#dStatus').textContent=p.status;
    $('#dName').textContent=p.name; $('#dName').classList.toggle('zh',!!p.zh);
    $('#dRole').textContent=p.role; $('#dNote').textContent=p.note;
    $('#dMod').textContent=clock(openedAt-3000);
    clearTimeout(clueTimer); gsap.killTweensOf($('#openedClue')); gsap.set($('#openedClue'),{opacity:0}); $('#openedClue').textContent='';
    paper.classList.remove('corner-open'); $('#cornerLift').setAttribute('aria-pressed','false');
    $('#systemLine').textContent='';
    gsap.set(bars,{scaleX:1}); gsap.set(stamp,{opacity:0,scale:1});
  }
  function completeRead(i,t) {
    if(t !== token || intent !== i) return;
    examined.add(i); gsap.set(stamp,{opacity:.85,scale:1}); hub.dataset.examined=[...examined].sort().join(',');
    if(examined.size===3) revealGhost();
    hub.dataset.selected=String(i); hub.dataset.phase='settled';
    updateThread();
    document.documentElement.dataset.ready='1';
  }
  async function select(value, options={}) {
    const i=Number(value);
    if(value === null || value === '' || !Number.isInteger(i) || i<0 || i>3 || !opened) return false;
    if(i===3) { if(unlocked) activateGhost(); return unlocked; }
    if(i===intent) return true;
    intent=i; const t=++token;
    if(selectionTL) selectionTL.kill();
    if(entranceTL && !options.initial) { entranceTL.progress(1); entranceTL.kill(); }
    gsap.killTweensOf(cards.slice(0,3).map(c=>c.el));
    gsap.set(cards.slice(0,3).map(c=>c.el),{opacity:1,x:0,y:0,rotation:0,scale:1});
    gsap.set(bars,{scaleX:1}); gsap.set(stamp,{opacity:0});
    index.forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));
    hub.dataset.phase='decoding';
    await Promise.all(cards.slice(0,3).map(c=>c.ready));
    if(t!==token) return false;
    const prev=cur;
    const swap=() => {
      if(t!==token) return;
      const at=order.indexOf(i); if(at>0) [order[0],order[at]]=[order[at],order[0]];
      cur=i; setOrder(); fill(i); hub.dataset.phase='revealing';
    };
    if(calm()) { swap(); gsap.set(bars,{scaleX:0}); completeRead(i,t); layout(); return true; }
    selectionTL=gsap.timeline({onUpdate:threadTick,onComplete:()=>completeRead(i,t)});
    if(prev>=0) selectionTL.to(cards[prev].el,{y:-12,rotation:4,opacity:0,duration:.16,ease:'power2.in'},0);
    selectionTL.call(swap,[],prev>=0?.12:0);
    const start=options.initial?.25:.14;
    selectionTL.fromTo(cards[i].el,{y:-12,scale:1.045,rotation:-1,opacity:0},{y:0,scale:1,rotation:0,opacity:1,duration:.24,ease:'power3.out',immediateRender:false},start);
    if(prev>=0) selectionTL.fromTo(cards[prev].el,{y:-5,opacity:.4},{y:0,opacity:1,duration:.18,ease:'power2.out',immediateRender:false},.25);
    selectionTL.call(()=> { if(t!==token) return; if(options.user) window.SFX?.snap(.10); },[],start+.22);
    selectionTL.to(cards[i].el,{y:1.5,duration:.035,ease:'none'},start+.24).to(cards[i].el,{y:0,duration:.075,ease:'power2.out'},start+.275);
    const revealAt=options.initial?.84:.30, duration=examined.has(i)?.16:.23;
    selectionTL.to(bars,{scaleX:0,duration,stagger:options.initial?.09:.08,ease:'power3.inOut'},revealAt);
    selectionTL.to(stamp,{opacity:.85,scale:1,duration:.12},options.initial?1.35:.82);
    return true;
  }
  function revealGhost(dev=false) {
    if(unlocked) return; unlocked=true;
    hub.classList.add('unlocked'); locations[3].hidden=false; index[3].hidden=false; locations[3].append(cards[3].el);
    $('#threadTail').hidden=false;
    fitPosters(); scheduleLayout();
    if(dev || calm()) { ghostFastened=true; gsap.set(cards[3].el,{opacity:1,x:0}); updateThread(); return; }
    gsap.set(cards[3].el,{opacity:0}); gsap.set(index[3],{opacity:0});
    ghostTL=gsap.timeline({onUpdate:threadTick,onComplete:()=> { $('#systemLine').textContent='04 / SIGNAL WEAK'; }});
    ghostTL.to($('#hubLamp'),{opacity:.65,duration:.1,yoyo:true,repeat:1},.35)
      .set(cards[3].el,{opacity:.35,x:3},.42).set(cards[3].el,{x:-2,opacity:.65},.49)
      .to(cards[3].el,{x:0,opacity:1,duration:.19,ease:'power1.out'},.55)
      .call(()=> { ghostFastened=true; updateThread(); },[],.55)
      .fromTo(index[3],{y:4,opacity:0},{y:0,opacity:1,duration:.25},.62);
  }
  function activateGhost() {
    if(!unlocked) return;
    if(typeof window.BB.onGhost==='function') { window.BB.onGhost(); return; }
    clearTimeout(ghostTimer); gsap.killTweensOf(cards[3].el);
    $('#systemLine').textContent='NO SIGNAL';
    if(!calm()) gsap.timeline().set(cards[3].el,{x:2}).to(cards[3].el,{x:-2,duration:.065,ease:'steps(1)'}).to(cards[3].el,{x:0,duration:.135,ease:'steps(1)'});
    ghostTimer=setTimeout(()=> { $('#systemLine').textContent='04 / SIGNAL WEAK'; },1800);
  }
  function initialIndex() {
    const sel=qp.get('sel'); if(sel!==null && /^[0-2]$/.test(sel)) return Number(sel);
    return ({luna:0,hound:1,smith:2})[window.Scene?.who] ?? 0;
  }
  function openHub() {
    if(opened) return; opened=true;
    document.documentElement.classList.add('hub-open'); hub.classList.toggle('is-calm',calm());
    gsap.set(hub,{autoAlpha:1}); setOrder(); configureDrag();
    if(qp.get('unlocked')==='1') { [0,1,2].forEach(i=>examined.add(i)); revealGhost(true); }
    if(!calm()) {
      entranceTL=gsap.timeline({onUpdate:threadTick});
      entranceTL.fromTo($('#wallCamera'),{scale:1},{scale:1.08,duration:.35,ease:'power2.out'},0)
        .fromTo($('#hubHeader'),{y:-6,opacity:0},{y:0,opacity:1,duration:.24},.14)
        .fromTo(locations.slice(1,3),{y:-8,opacity:0},{y:0,opacity:1,duration:.27,stagger:.08},.39)
        .fromTo($('#evidenceArea'),{y:-8,opacity:0},{y:0,opacity:1,duration:.24},.58)
        .fromTo($('#strings'),{opacity:0},{opacity:1,duration:.38},.65)
        .fromTo([$('#hubIndex'),$('#back')],{y:4,opacity:0},{y:0,opacity:1,duration:.24},.70);
    }
    select(initialIndex(),{initial:true});
  }
  $('#dMod').addEventListener('click',()=> {
    if(hub.dataset.phase!=='settled') return;
    clearTimeout(clueTimer); $('#openedClue').textContent=`OPENED ${clock(openedAt)}`;
    $('#openedClue').setAttribute('aria-hidden','false');
    gsap.to($('#openedClue'),{opacity:1,duration:calm()?0:.12});
    clueTimer=setTimeout(()=> { gsap.to($('#openedClue'),{opacity:0,duration:calm()?0:.2}); $('#openedClue').setAttribute('aria-hidden','true'); },3000);
  });
  $('#cornerLift').addEventListener('click',()=> { const on=paper.classList.toggle('corner-open'); $('#cornerLift').setAttribute('aria-pressed',String(on)); });
  $('#threadTail').addEventListener('click',()=> {
    if(unlocked || calm()) return;
    const tension={v:0}; gsap.timeline({onUpdate:()=> { tailTension=tension.v; updateThread(); }})
      .to(tension,{v:-9,duration:.12,ease:'power2.out'}).to(tension,{v:0,duration:.32,ease:'sine.out'});
  });
  $('#back').addEventListener('click',()=> { const url=new URL(location.href); ['hub','still','sel','unlocked'].forEach(k=>url.searchParams.delete(k)); location.href=url.href; });
  addEventListener('keydown', e=> {
    if(!opened || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
    const forward=['ArrowRight','ArrowDown'].includes(e.key), backward=['ArrowLeft','ArrowUp'].includes(e.key);
    if(!forward && !backward) return;
    e.preventDefault(); const focused=index.indexOf(document.activeElement); const base=focused===3?3:intent;
    const next=Math.max(0,Math.min(unlocked?3:2,base+(forward?1:-1)));
    index[next].focus({preventScroll:true}); if(next<3) select(next,{user:true});
  });
  let swipe, suppressClickUntil=0;
  stage.addEventListener('pointerdown',e=> { if(portraitMQ.matches && e.isPrimary) swipe={x:e.clientX,y:e.clientY,id:e.pointerId,time:Date.now()}; },{passive:true});
  stage.addEventListener('pointerup',e=> {
    if(!swipe || e.pointerId!==swipe.id) return;
    const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y,dt=Date.now()-swipe.time; swipe=undefined;
    if(Math.abs(dx)>45 && Math.abs(dx)>Math.abs(dy)*1.4 && dt<900) { suppressClickUntil=Date.now()+350; select(Math.max(0,Math.min(2,intent+(dx<0?1:-1))),{user:true}); }
  },{passive:true});
  stage.addEventListener('click',e=> { if(Date.now()<suppressClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); } },true);
  stage.addEventListener('pointercancel',()=> { swipe=undefined; });
  addEventListener('resize',scheduleLayout,{passive:true});
  portraitMQ.addEventListener('change',()=> { if(opened) configureDrag(); });
  motionMQ.addEventListener('change',()=> {
    reduced=motionMQ.matches; hub.classList.toggle('is-calm',calm());
    if(calm()) { entranceTL?.progress(1); selectionTL?.progress(1); ghostTL?.progress(1); }
    if(opened) configureDrag();
  });
  const external=window.BB || {}; window.BB={...external,openHub,select};
  if(qp.get('hub')==='1') addEventListener('load',async()=> {
    document.querySelector('main').style.display='none';
    await Promise.all(cards.map(c=>c.ready));
    await document.fonts.ready;
    openHub(); layout();
  });
  document.fonts.ready.then(scheduleLayout);
})();
