/* ENTER 按键有三种形态，在地址后面加 ?btn=a / b / c 切换（b 是他选定的默认）：
   a = 纸质的键帽（有厚度、缝线、红色指示灯）  b = 漫画菜单的斜切黑条（白色底板，悬停时翻成红）  c = 街机的圆形红按钮 + 金属铭牌 */
(() => {
  const v = new URLSearchParams(location.search).get('btn') || 'b', b = document.getElementById('enter');   // 默认 b（他选的）
  if (v === 'b') { b.classList.add('v-b'); b.innerHTML = '<i class="b-slab"></i><span class="b-face"><i class="b-tri"></i><span class="e-txt">ENTER</span></span>'; }
  if (v === 'c') { b.classList.add('v-c'); b.innerHTML = '<span class="c-housing"><i class="c-dome"></i></span><span class="c-plate"><i class="c-rivet"></i><span class="e-txt">ENTER</span><span class="e-arr">▶▶</span><i class="c-rivet"></i></span>'; }
})();
/* 首页场景：像动态壁纸一样"微微在动"。
   混合背景：一面贴满照片和线的证据墙，中央一团放射的网点光，两盏顶灯；墙上随手贴着四张"撕拉片"通缉令（第四张是问号）。
   分层（从后到前）：证据墙 + 贴纸 + 灯光 → 投影/倒影 → 背光 → 人物 → 红线 → 灰尘。
   三位成员每次打开随机出场一个；加 ?c=luna / hound / smith 可以指定。
   红线：从人物手里垂到地上，拖向观众；鼠标移到 ENTER 上，它被拉紧、接到按钮——"他们在放线，等你上钩"。 */
(() => {
  const W = 1672, H = 941;                                   // 场景的坐标系（和证据墙图的尺寸一致）
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // box：人物在图里的外框（0~1）；hand：握线的那只手（0~1）；poster：他/她的通缉令是第几张
  const CHARS = {
    luna:  { box: [.3021, .0219, .7742, .9729], hand: [.3428, .4974], poster: 0, feet: [[.444, .941], [.619, .968]] },
    hound: { box: [.2812, .0207, .7372, .9660], hand: [.3080, .4876], poster: 1, feet: [[.418, .947], [.674, .964]] },   // 左脚比右脚高：每只脚各给一个接触阴影，才看得出两只都踩在地上
    smith: { box: [.3541, .0202, .6477, .9617], hand: [.3917, .4676], poster: 2, feet: [[.400, .951], [.589, .959]] },
  };
  const STAGE = { cx: 836, feetY: 873, figH: 650 };           // 三个人站在同一个位置：房间正中，灯光下
  const names = Object.keys(CHARS);

  // 海报是 GPT 画的撕纸海报，我们只管"贴"：小小一张，不对称地贴在墙上，大小不一、高低错落、各歪各的。
  // 避开人物（中间约 x 590~1090），让视线留在人物身上；每次打开再各自抖一点点，像真有人随手贴的。
  // tape：胶带的位置（占海报宽高的百分比）、角度、宽度；要贴在不挡字的地方。hover 时海报放大到可以看清细节。
  const POSTERS = [
    { n: 'luna',    x: 112,  y: 236, w: 158, r: -6,   tape: { x: 70, y: -2, r: 24, w: 30 } },         // 左上
    { n: 'hound',   x: 1236, y: 322, w: 132, r: 6.5,  tape: { x: 89, y: 44, r: 76, w: 26 } },         // 右中：胶带贴在右边缘，不挡标题
    { n: 'smith',   x: 318,  y: 486, w: 122, r: 3.5,  tape: { x: 58, y: -2, r: -12, w: 28 } },        // 左下偏中
    { n: 'unknown', x: 1286, y: 168, w: 144, r: -9,    tape: { x: 4, y: -2, r: -30, w: 28 } },         // 右上偏下，最歪；不能压住右边的路灯（路灯在 x≈1525）
  ];
  const DECOR = [
    { src: 'assets/stk-evidence.webp', x: 138, y: 216, w: 104, r: -3 },        // 压在 Luna 海报的上沿（避开左边的路灯）
    { src: 'assets/stk-barcode.webp', x: 1326, y: 478, w: 104, r: 8 },        // 右中，压在 Hound 海报的下面
  ];
  const jit = (v, a) => v + (Math.random() - .5) * 2 * a;
  const LAMPS = [{ x: 152, y: 120, rx: 125, ry: 170 }, { x: 1524, y: 130, rx: 125, ry: 170 }];   // 两盏路灯和它们的光锥：任何东西都不许贴在上面

  // 随机出场：不和上一次重复
  let pick = new URLSearchParams(location.search).get('c');
  if (!CHARS[pick]) {
    let last = null; try { last = localStorage.getItem('bb_char'); } catch (e) { /* 没有就算了 */ }
    const pool = names.filter((n) => n !== last);
    pick = pool[Math.floor(Math.random() * pool.length)];
  }
  try { localStorage.setItem('bb_char', pick); } catch (e) { /* 隐私模式 */ }
  const C = Object.assign({}, CHARS[pick], STAGE);

  const sceneEl = document.getElementById('scene');
  const enterBtn = document.getElementById('enter');
  const el = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; (parent || sceneEl).append(e); return e; };
  // 分批加载：不是最要紧的图先不请求，等墙和人物到了再放行（否则几十张图一起抢带宽，最重要的人物反而最后到：限速 5 Mbps 实测 7 秒）
  const late = [];
  const defer = (img, url, group) => { late.push({ img, url, group }); };
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); parent.append(e); return e; };

  /* ---------- 图层 ---------- */
  const bgPar = el('div', 'L lyr');                               // 背景组：证据墙、贴纸、灯光（视差幅度最小）
  const plate = el('img', 'L plate', bgPar); const pq = new URLSearchParams(location.search).get('plate'); const startKey = pq && /^[a-z]$/.test(pq) ? pq : 'k';             // 默认用重画过墙脚的 K；?plate=e 可以回到旧的涂鸦墙
  plate.src = `assets/s-plate-${startKey}.jpg`;
  const FX_PLATES = new Set(['d', 'e', 'f', 'g', 'h', 'i', 'j']);   // 这些底板的墙脚是我用叠加层补的；k / l 是重画的，自带踢脚线和倒影，叠加层要关掉 plate.alt = ''; plate.draggable = false;
  ['lampL', 'lampR', 'burst'].forEach((c) => el('div', 'glow ' + c, bgPar));   // 灯光：会呼吸、偶尔闪一下
  ['shaft', 'rays r1', 'rays r2', 'bloom', 'streak', 'beam', 'flare'].forEach((c) => el('div', 'lfx ' + c, bgPar));   // 中央光晕的光效：从上往下的光束、缓慢旋转的光芒、泛光、一道横向的光斑
  const PLATES = ['e', 'k', 'l', 'f', 'g', 'h', 'i', 'j', 'd'];          // 彩蛋：按 P 键换墙面（涂鸦 / 壁画 / 砖墙 / 模板喷涂 / 水墨 / 泼溅 / 旧海报墙）。没有任何提示文字
  let plateIx = Math.max(0, PLATES.indexOf(startKey)), plateBusy = false;
  const plateTop = el('img', 'L plate', bgPar); plateTop.alt = ''; plateTop.draggable = false; plateTop.style.opacity = 0;   // 换墙面时盖在上面淡入的那一张
  function showPlate() {
    if (plateBusy) return; plateBusy = true;
    plateIx = (plateIx + 1) % PLATES.length;
    const src = `assets/s-plate-${PLATES[plateIx]}.jpg`, im = new Image();
    im.onload = () => {
      plateTop.src = src; wallRefl.src = src;
      gsap.to(floorBoard, { opacity: FX_PLATES.has(PLATES[plateIx]) ? 1 : 0, duration: .7 });
      gsap.fromTo(plateTop, { opacity: 0 }, { opacity: 1, duration: .7, ease: 'power1.inOut', onComplete: () => { plate.src = src; plateTop.style.opacity = 0; plateBusy = false; } });
    };
    im.onerror = () => { plateBusy = false; };
    im.src = src;
  }
  addEventListener('keydown', (e) => { if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && !e.altKey) showPlate(); });
  // 墙脚和地面的交界（原图里那里只有一条很亮、很直的细线，所以看起来像布景的边，不像一面墙立在地上）：
  //   ① 墙脚的暗角  ② 地面上墙的倒影  ③ 一条有高光和厚度的踢脚线盖住那条亮线  ④ 踢脚线投在地上的影子
  const floorBoard = el('div', 'wall', bgPar);
  el('div', 'fx-ao', floorBoard);
  const reflBox = el('div', 'fx-refl', floorBoard);
  const wallRefl = el('img', null, reflBox); wallRefl.src = plate.src; wallRefl.alt = ''; wallRefl.draggable = false;   // 墙在地面上的倒影（换墙面时也要换）
  el('div', 'fx-base', floorBoard); el('div', 'fx-baseshade', floorBoard);
  if (!FX_PLATES.has(startKey)) floorBoard.style.opacity = 0;
  const wallFar = el('div', 'wall', bgPar);                   // 远层墙：又暗又小的分镜（贴纸画板是 1672x941 的，整块按场景缩放）
  const midPar = el('div', 'L lyr');                              // 近层组：亮一点的分镜、海报、装饰（视差幅度比背景大一点）
  const wallNear = el('div', 'wall', midPar);
  // 一张海报 = .pst（负责"啪"地贴上去：缩放/旋转/下落）> .pin（负责悬停放大）> 影子 + 海报 + 胶带
  const posters = POSTERS.map((s, k) => {
    const rot = jit(s.r, 1.6), w = s.w * (1 + (Math.random() - .5) * .06);
    const pst = el('div', 'pst', wallNear), sw = el('div', 'sw', pst), pin = el('div', 'pin', sw);
    const bx = jit(s.x, 10);
    pst.style.cssText = `left:${bx.toFixed(1)}px;top:${jit(s.y, 10).toFixed(1)}px;width:${w.toFixed(1)}px;z-index:${20 + Math.floor(Math.random() * 3)}`;
    const sh = el('img', 'sh', pin), pp = el('img', 'pp', pin), tape = el('img', 'tape', pin);
    defer(sh, `assets/poster-${s.n}.webp`, 'poster'); defer(pp, `assets/poster-${s.n}.webp`, 'poster'); sh.alt = pp.alt = ''; sh.draggable = pp.draggable = false;
    defer(tape, 'assets/stk-tape.webp', 'poster'); tape.alt = ''; tape.draggable = false;
    gsap.set(pst, { opacity: 0 }); gsap.set(tape, { opacity: 0 });                 // 图到了、开场轮到它，才露面
    tape.style.cssText = `left:${s.tape.x}%;top:${s.tape.y}%;width:${s.tape.w}%;transform:rotate(${s.tape.r}deg)`;
    // 悬停：像用手指把它翘起来看一眼——放大、影子拉长；z-index 抬到最上
    pst.addEventListener('pointerenter', () => { pst.style.zIndex = 40; gsap.to(pin, { scale: 1.07, x: -2, y: -4, duration: .3, ease: 'power3.out', overwrite: 'auto' }); gsap.to(sh, { x: 9, y: 13, opacity: .62, duration: .3, overwrite: 'auto' }); });
    pst.addEventListener('pointerleave', () => { gsap.to(pin, { scale: 1, x: 0, y: 0, duration: .35, ease: 'power3.out', overwrite: 'auto' }); gsap.to(sh, { x: 5, y: 8, opacity: .55, duration: .35, overwrite: 'auto' }); setTimeout(() => { pst.style.zIndex = 20 + k % 3; }, 350); });
    gsap.set(pst, { rotation: rot, transformOrigin: '50% 40%' }); gsap.set(sh, { x: 5, y: 8 });
    return { pst, sw, pp, sh, tape, rot, bx, w, hero: k === C.poster };
  });
  const decor = DECOR.map((d) => { const im = el('img', 'stk', wallNear), bx = jit(d.x, 8); defer(im, d.src, 'poster'); im.alt = ''; im.style.cssText = `left:${bx.toFixed(1)}px;top:${jit(d.y, 8).toFixed(1)}px;width:${d.w}px;--r:${jit(d.r, 2).toFixed(2)}deg`; return { im, bx, w: d.w }; });
  posters[C.poster].pst.classList.add('me');                  // 站在前面的这位，他的海报亮一点，其余的暗一点

  /* ---------- 分镜墙：把 GPT 画的小分镜一张张贴满墙面 ----------
     错落的网格，每格抽一张不同的分镜（每次打开抽的不同），避开头顶那团光和中间的人物；远层暗、近层亮，层次靠明暗和视差。 */
  const panels = [];
  (function buildPanels() {
    const list = (window.PANELS || []).slice().sort(() => Math.random() - .5);
    if (!list.length) return;
    const X0 = 56, Y0 = 26, CW = 188, CH = 134, COLS = 8, ROWS = 5, cells = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cx = X0 + (c + .5) * CW + (Math.random() - .5) * 52, cy = Y0 + (r + .5) * CH + (Math.random() - .5) * 36;
      const inBurst = ((cx - 836) / 250) ** 2 + ((cy - 140) / 230) ** 2 < 1;          // 头顶那团光
      const inBody = cx > 690 && cx < 990 && cy > 230;                                  // 中间的人物
      const inLamp = LAMPS.some((l) => ((cx - l.x) / l.rx) ** 2 + ((cy - l.y) / l.ry) ** 2 < 1);
      if (!inBurst && !inBody && !inLamp && cy < 735) cells.push({ cx, cy });
    }
    cells.sort(() => Math.random() - .5);
    cells.slice(0, Math.min(cells.length, 22)).forEach((cell, n) => {
      const d = list[n % list.length], far = Math.random() < .55, ar = d.ar;
      let w = (far ? 78 : 96) + Math.random() * (far ? 46 : 58); if (ar > 1.3) w *= 1.18;
      if (w / ar > 150) w = 150 * ar;
      const rot = (Math.random() - .5) * 18, bx = cell.cx - w / 2, by = cell.cy - w / ar / 2;
      const box = el('div', 'pnl', far ? wallFar : wallNear), sw = el('div', 'psw', box), im = el('img', null, sw);
      defer(im, 'assets/' + d.f, 'panel'); im.alt = ''; im.draggable = false;
      const b = far ? .5 + Math.random() * .22 : .8 + Math.random() * .2;
      box.style.cssText = `left:${bx.toFixed(1)}px;top:${by.toFixed(1)}px;width:${w.toFixed(1)}px;z-index:${far ? 1 + (n % 4) : 4 + (n % 6)}`;
      im.style.filter = `brightness(${b.toFixed(2)}) drop-shadow(2px 3px 0 rgba(0,0,0,.55)) drop-shadow(0 4px 7px rgba(0,0,0,.5))`;
      if (Math.random() < .34) {                                                       // 三分之一的分镜用一小条胶带粘着
        const tp = el('img', 'ptape', box); defer(tp, 'assets/stk-tape.webp', 'panel'); tp.alt = ''; tp.draggable = false;
        tp.style.cssText = `left:${10 + Math.random() * 55}%;top:-5%;width:${26 + Math.random() * 10}%;transform:rotate(${(Math.random() - .5) * 60}deg)`;
      }
      gsap.set(box, { rotation: rot, transformOrigin: '50% 50%' });
      box.addEventListener('pointerenter', () => { box.style.zIndex = 30; gsap.to(box, { scale: 1.06, rotation: rot * .85, duration: .3, ease: 'power3.out', overwrite: 'auto' }); });
      box.addEventListener('pointerleave', () => { gsap.to(box, { scale: 1, rotation: rot, duration: .35, ease: 'power3.out', overwrite: 'auto' }); setTimeout(() => { box.style.zIndex = far ? 1 + (n % 4) : 4 + (n % 6); }, 350); });
      gsap.set(box, { opacity: 0 });
      panels.push({ el: box, sw, im, bx, w, rot, far });
    });
  })();

  // 开场：海报一张张被"啪"地贴上墙。从高处拍下来（放大 → 落下），影子随之收紧，墙面轻轻一震，胶带最后冒出来。站着的那位最后贴。
  function slapOn() {
    const order = posters.map((_, i) => i).filter((i) => i !== C.poster).sort(() => Math.random() - .5).concat(C.poster);
    const tl = gsap.timeline({ delay: .3 });
    order.forEach((i, n) => {
      const p = posters[i], t = n * .5;
      gsap.set(p.pst, { opacity: 0 });
      tl.set(p.pst, { opacity: 1, scale: 1.7, rotation: p.rot + (Math.random() < .5 ? -9 : 9), y: -26 }, t)
        .set(p.sh, { x: 30, y: 44, opacity: .3 }, t)
        .to(p.pst, { scale: .965, rotation: p.rot, y: 0, duration: .17, ease: 'power3.in' }, t)                 // 拍下来
        .to(p.sh, { x: 5, y: 8, opacity: .55, duration: .17, ease: 'power3.in' }, t)
        .add(() => { window.SFX.thud(.1); gsap.fromTo(sceneEl, { x: 0, y: 0 }, { x: 2.5, y: 2, duration: .06, yoyo: true, repeat: 3, ease: 'none' }); }, t + .17)   // 啪 + 墙轻震
        .to(p.pst, { scale: 1, duration: .5, ease: 'elastic.out(1.3, .35)' }, t + .17)                          // 纸弹回来、微微鼓一下
        .fromTo(p.tape, { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: .22, ease: 'back.out(2)' }, t + .3);
      gsap.set(p.tape, { opacity: 0 });
    });
  }
  function enterPanel(p, delay) {                              // 一张分镜到货了：自己"啪"地贴上去
    gsap.fromTo(p.el, { opacity: 0, scale: 1.45, rotation: p.rot + (Math.random() < .5 ? -7 : 7) }, { opacity: 1, scale: 1, rotation: p.rot, duration: .32, ease: 'back.out(1.7)', delay });
  }

  const figPar = el('div', 'L lyr');                              // 人物组（视差幅度中等）
  const figWrap = el('div', 'fig-wrap', figPar);              // 呼吸 / 微微摇晃作用在它身上
  const shadow = el('img', 'shadow', figWrap);                // 投在地上的影子：背后是光，影子朝观众拖过来
  const refl = el('img', 'refl', figWrap);                    // 地面倒影
  const csBase = el('div', 'cs0', figWrap);                   // 横跨双脚的一块接地暗区：两只鞋都落在同一片阴影里，眼睛就把它们读成踩在同一个地面上
  const csUnder = [0, 1].map(() => el('div', 'cs', figWrap));   // 每只脚下一团软影（在人物后面）
  const halo = el('img', 'halo', figWrap);                    // 背光：人物的白色剪影，糊一下
  const fig = el('img', 'fig', figWrap);
  const csOver = [0, 1].map(() => el('div', 'cs2', figWrap));    // 压在鞋底边缘上的一道暗边（在人物前面）：鞋底像陷进影子里，就不会显得飘
  const hand = el('i', 'hand', figWrap);                      // 一个看不见的点，红线从这里出发
  [shadow, refl, halo, fig].forEach((im) => { im.src = `assets/s-${pick}-char.webp`; im.alt = ''; im.draggable = false; });
  const fogA = el('div', 'fog fa'), fogB = el('div', 'fog fb');   // 贴地薄雾

  const thread = svgEl('svg', { class: 'L thread', viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, sceneEl);
  const line = svgEl('path', { class: 'line' }, thread);
  const cap = svgEl('circle', { class: 'cap', r: 6 }, thread);

  const dustPar = el('div', 'L lyr');                             // 灰尘组（视差幅度最大）
  const dustCanvas = el('canvas', 'L dust', dustPar);

  gsap.set(bgPar, { scale: 1.03 }); gsap.set(midPar, { scale: 1.02 });                           // 背景组放大一点，视差移动时边缘不会露出黑底

  /* ---------- 版面：按 cover 铺满，竖屏时让人物居中 ---------- */
  let S = 1;
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    S = Math.max(vw / W, vh / H);
    const sw = W * S, sh = H * S;
    const left = Math.min(0, Math.max(vw - sw, vw / 2 - C.cx * S));
    sceneEl.style.width = sw + 'px'; sceneEl.style.height = sh + 'px';
    sceneEl.style.left = left + 'px'; sceneEl.style.top = (vh - sh) / 2 + 'px'; sceneEl.style.setProperty('--s', S);
    wallFar.style.transform = wallNear.style.transform = floorBoard.style.transform = `scale(${S})`;   // 贴纸画板是 1672x941 像素，按场景缩放
    // 窄屏会把场景左右裁掉：海报始终收进可见范围（挤到人物背后也没关系，它本来就在墙上，人站在前面）
    const visL = -left / S + 14, visR = (vw - left) / S - 14;
    [...posters, ...decor, ...panels].forEach((o) => { const x = Math.max(visL, Math.min(o.bx, visR - o.w)); (o.pst || o.im || o.el).style.left = x.toFixed(1) + 'px'; });
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    dustCanvas.width = Math.round(sw * dpr); dustCanvas.height = Math.round(sh * dpr);
  }

  // 人物摆放：图片的宽高比要等图片加载完才知道
  const loaded = new Promise((res) => { if (fig.complete && fig.naturalWidth) res(); else fig.onload = () => res(); });
  let feetPct = 96;
  function placeFigure() {
    const iw = fig.naturalWidth, ih = fig.naturalHeight;
    const [x0, y0, x1, y1] = C.box;
    const sf = C.figH / ((y1 - y0) * ih);                     // 图片 → 场景像素 的缩放
    const w = iw * sf, h = ih * sf;
    const left = C.cx - ((x0 + x1) / 2) * w, top = C.feetY - y1 * h;
    Object.assign(figWrap.style, { left: left / W * 100 + '%', top: top / H * 100 + '%', width: w / W * 100 + '%', height: h / H * 100 + '%' });
    feetPct = y1 * 100;
    refl.style.top = (2 * y1 - 1) * 100 + '%';                // 倒影：以脚底线为轴翻过去
    shadow.style.transformOrigin = `50% ${feetPct}%`;         // 投影：同一条轴，压扁后朝观众拖过来
    hand.style.left = C.hand[0] * 100 + '%'; hand.style.top = C.hand[1] * 100 + '%';
    C.feet.forEach(([fx, fy], i) => {
      Object.assign(csUnder[i].style, { left: fx * 100 + '%', top: (fy + .005) * 100 + '%', width: '23%', height: '4.8%' });
      Object.assign(csOver[i].style, { left: fx * 100 + '%', top: (fy - .003) * 100 + '%', width: '17%', height: '2.3%' });
    });
    const [[lx, ly], [rx, ry]] = C.feet;
    Object.assign(csBase.style, { left: (lx + rx) / 2 * 100 + '%', top: (Math.max(ly, ry) + .004) * 100 + '%', width: (Math.abs(rx - lx) + .3) * 100 + '%', height: '6.5%' });
    fogA.style.top = fogB.style.top = (C.feetY - 40) / H * 100 + '%';
    figWrap.style.transformOrigin = `50% ${feetPct}%`;
  }

  /* ---------- 红线：一根真正的绳子 ----------
     Verlet 积分 + 距离约束 + 地面碰撞：一头握在手里，自己的重量让它垂下去、落在地上、沿着地面拖向观众；
     鼠标划过会把它拨动；鼠标移到 ENTER 上，他们"放线"——绳子变长、另一头被拉到按钮上，绷到刚好有一点点垂。 */
  const th = { k: 0 };                                        // 0 = 自由；1 = 末端钉在 ENTER 上
  const N = 28, BASE_SEG = 33;
  let seg = BASE_SEG, ropeReady = false, tgt = null;
  const R = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
  const floorY = (x) => 886 + Math.max(0, 940 - x) * .17;    // 地面是斜的：越靠近观众（画面左下）越低
  const ptr = { x: -999, y: -999, vx: 0, vy: 0, on: false };
  function toScene(cx, cy) { const r = sceneEl.getBoundingClientRect(); return { x: (cx - r.left) / r.width * W, y: (cy - r.top) / r.height * H }; }
  function handScene() { const r = hand.getBoundingClientRect(); return toScene(r.left, r.top); }
  function ropeInit(h) {
    let x = h.x, y = h.y;
    for (let i = 0; i < N; i++) {
      R[i].x = R[i].px = x; R[i].y = R[i].py = y;
      const fy = floorY(x);
      if (y + seg < fy) y += seg; else { y = fy; x -= seg * .95; }                  // 先垂下去，碰到地面就向左前方铺开
    }
    ropeReady = true;
  }
  function stepRope(dt) {
    const h = handScene();
    if (!isFinite(h.x + h.y)) return;                          // 页面还没排好版（或被浏览器暂停恢复）的那一帧：不算
    if (!ropeReady || !isFinite(R[N - 1].x + R[N - 1].y)) ropeInit(h);
    if (th.k > .001) { const b = enterBtn.getBoundingClientRect(); tgt = toScene(b.left + b.width * .1, b.top + b.height * .55); }
    const want = tgt && th.k > .01 ? Math.max(BASE_SEG, Math.hypot(tgt.x - h.x, tgt.y - h.y) * 1.035 / (N - 1)) : BASE_SEG;
    seg += (want - seg) * .12;                                  // 放线：被拉向按钮时绳子变长，松开后慢慢收回
    const SUB = 2, d = dt / SUB, g = 2600;
    for (let s = 0; s < SUB; s++) {
      for (let i = 1; i < N; i++) {                             // 受力：重力 + 一点点空气阻力
        const p = R[i], vx = (p.x - p.px) * .993, vy = (p.y - p.py) * .993;
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + g * d * d;
      }
      if (ptr.on && (Math.abs(ptr.vx) + Math.abs(ptr.vy)) > .5) {   // 鼠标划过：拨动离得近的那几段
        for (let i = 3; i < N; i++) {
          const p = R[i], dist = Math.hypot(p.x - ptr.x, p.y - ptr.y);
          if (dist < 52) { const f = (1 - dist / 52) * .5; p.x += ptr.vx * f; p.y += ptr.vy * f * .7; }
        }
        ptr.vx *= .6; ptr.vy *= .6;
      }
      for (let it = 0; it < 14; it++) {                         // 约束：每一节的长度不变；一头钉在手上；另一头按权重拉向 ENTER
        R[0].x = h.x; R[0].y = h.y;
        if (tgt && th.k > .001) { const e = R[N - 1]; e.x += (tgt.x - e.x) * th.k; e.y += (tgt.y - e.y) * th.k; }
        const endPinned = th.k > .98;
        for (let i = 0; i < N - 1; i++) {
          const a = R[i], b = R[i + 1], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy) || 1e-4, diff = (dist - seg) / dist;
          const wa = i === 0 ? 0 : (i + 1 === N - 1 && endPinned ? 1 : .5), wb = i === 0 ? 1 : (i + 1 === N - 1 && endPinned ? 0 : .5);
          a.x += dx * diff * wa; a.y += dy * diff * wa; b.x -= dx * diff * wb; b.y -= dy * diff * wb;
        }
        for (let i = 1; i < N; i++) { const p = R[i], fy = floorY(p.x); if (p.y > fy) { p.y = fy; p.px = p.x - (p.x - p.px) * .78; } }   // 落在地上：和地面有摩擦
      }
    }
  }
  function drawRope() {
    if (!ropeReady) return;
    let d = `M${R[0].x.toFixed(1)} ${R[0].y.toFixed(1)}`;       // Catmull-Rom → 贝塞尔
    for (let i = 0; i < N - 1; i++) {
      const p0 = R[Math.max(0, i - 1)], p1 = R[i], p2 = R[i + 1], p3 = R[Math.min(N - 1, i + 2)];
      d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    if (/NaN/.test(d)) return;
    line.setAttribute('d', d);
    cap.setAttribute('cx', R[N - 1].x.toFixed(1)); cap.setAttribute('cy', R[N - 1].y.toFixed(1)); cap.style.opacity = Math.max(0, (th.k - .55) / .45);
  }
  // 供转场使用：当前红线在屏幕坐标里的折线（手 → 末端），以及"把线拉紧"
  function threadScreen() {
    const r = sceneEl.getBoundingClientRect(), k = r.width / W;
    return R.map((p) => ({ x: r.left + p.x * k, y: r.top + p.y * k }));
  }
  const pull = (cb) => gsap.to(th, { k: 1, duration: th.k > .95 ? .01 : .35, ease: 'power3.out', overwrite: true, onComplete: cb });
  const lead = (on) => gsap.to(th, { k: on ? 1 : 0, duration: on ? .7 : 1, ease: on ? 'power3.out' : 'power2.inOut', overwrite: true });
  ['pointerenter', 'focus'].forEach((ev) => enterBtn.addEventListener(ev, () => lead(true)));
  ['pointerleave', 'blur'].forEach((ev) => enterBtn.addEventListener(ev, () => lead(false)));
  if (matchMedia('(hover: none)').matches) setTimeout(() => lead(true), 3200);   // 触屏没有 hover，过一会儿自己拉过去
  addEventListener('pointermove', (e) => {                       // 鼠标在场景里的位置和移动速度（场景像素）
    const q = toScene(e.clientX, e.clientY);
    ptr.vx = isFinite(ptr.x) && ptr.on ? q.x - ptr.x : 0; ptr.vy = ptr.on ? q.y - ptr.y : 0; ptr.x = q.x; ptr.y = q.y; ptr.on = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { ptr.on = false; });

  /* ---------- 贴着的东西会"活"：随风轻晃；鼠标一靠近，就被带得微微抬起、歪一下 ----------
     分镜和海报都挂在胶带那一点上（transform-origin 在上沿中点），晃的是围着那一点的小角度；鼠标越近，抬得越高、歪得越明显。 */
  const swayItems = [];
  // 注意：quickTo 不支持 scale 这个简写，要把 scaleX / scaleY 分开控制
  function regSway(inner, host, amp, R0) {
    gsap.set(inner, { transformOrigin: '50% 0%' });
    swayItems.push({ host, qr: gsap.quickTo(inner, 'rotation', { duration: .6, ease: 'power3' }), qs: ((qx, qy) => (v) => { qx(v); qy(v); })(gsap.quickTo(inner, 'scaleX', { duration: .45, ease: 'power3' }), gsap.quickTo(inner, 'scaleY', { duration: .45, ease: 'power3' })), qy: gsap.quickTo(inner, 'y', { duration: .45, ease: 'power3' }),
      amp, ph: Math.random() * 6.3, spd: .5 + Math.random() * .6, R: R0, cx: null, cy: null });
  }
  posters.forEach((p) => regSway(p.sw, p.pst, .9, 190));
  panels.forEach((p) => regSway(p.sw, p.el, p.far ? .5 : .8, 150));
  function measureSway() {
    const sr = sceneEl.getBoundingClientRect(), k = sr.width / W;
    swayItems.forEach((it) => { const r = it.host.getBoundingClientRect(); it.cx = (r.left + r.width / 2 - sr.left) / k; it.cy = (r.top + r.height / 2 - sr.top) / k; });
  }
  setInterval(measureSway, 1500); setTimeout(measureSway, 600);
  let swayFrame = 0;
  function stepSway(t) {
    if ((swayFrame++ & 1) || reduce) return;                    // 隔一帧算一次就够了
    const wind = Math.sin(t * .37) + Math.sin(t * .91 + 1.3) * .5;   // 整面墙共用的一阵一阵的微风
    for (const it of swayItems) {
      let lift = 0, push = 0;
      if (ptr.on && it.cx != null) {
        const dx = it.cx - ptr.x, dy = it.cy - ptr.y, k = Math.max(0, 1 - Math.hypot(dx, dy) / it.R);
        lift = k * k; push = (dx >= 0 ? 1 : -1) * lift * 2.4;
      }
      it.qr(Math.sin(t * it.spd + it.ph) * it.amp + wind * it.amp * .4 + push); it.qs(1 + lift * .035); it.qy(-lift * 3);
    }
  }

  /* ---------- 灰尘 ---------- */
  const dctx = dustCanvas.getContext('2d');
  const dust = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .6 + Math.random() * 1.6, vx: (Math.random() - .5) * 6, vy: -2 - Math.random() * 7, f: .4 + Math.random() * 1.2, ph: Math.random() * 6.3, z: .4 + Math.random() * .6 }));
  // 右边那盏灯的光锥：灯在 (1522, 96)，光朝右下斜着打出来（偏离竖直约 7°），锥里有尘埃缓慢飘过并闪烁
  const CONE = { x: 1522, y: 98, dx: .122, dy: .993, len: 330 };
  const motes = Array.from({ length: 34 }, () => ({ t: Math.random(), u: Math.random() - .5, ph: Math.random() * 6.3, f: .8 + Math.random() * 2, r: .8 + Math.random() * 1.7, sp: .012 + Math.random() * .02 }));
  function drawDust(t, dt) {
    const k = dustCanvas.width / W;
    dctx.clearRect(0, 0, dustCanvas.width, dustCanvas.height); dctx.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      m.t += m.sp * dt; if (m.t > 1) { m.t = 0; m.u = Math.random() - .5; }
      const along = m.t * CONE.len, wide = 12 + m.t * 105, px = CONE.x + CONE.dx * along + CONE.dy * m.u * wide + Math.sin(t * .6 + m.ph) * 4, py = CONE.y + CONE.dy * along - CONE.dx * m.u * wide;
      dctx.globalAlpha = Math.max(0, (1 - m.t) * (.25 + .6 * (.5 + .5 * Math.sin(t * m.f + m.ph))));
      dctx.fillStyle = '#fff'; dctx.beginPath(); dctx.arc(px * k, py * k, m.r * k, 0, 6.2832); dctx.fill();
    }
    for (const p of dust) {
      p.x += p.vx * dt * p.z; p.y += p.vy * dt * p.z;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      dctx.globalAlpha = (.1 + .3 * (.5 + .5 * Math.sin(t * p.f + p.ph))) * p.z;
      dctx.fillStyle = '#fff'; dctx.beginPath(); dctx.arc(p.x * k, p.y * k, p.r * k * p.z, 0, 6.2832); dctx.fill();
    }
  }

  /* ---------- 呼吸、摇晃、背光、视差 ---------- */
  function startMotion() {
    gsap.set(figWrap, { transformOrigin: `50% ${feetPct}%` });
    gsap.to(figWrap, { scaleY: 1.007, scaleX: 1.002, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });   // 呼吸
    gsap.to(figWrap, { rotation: .3, duration: 3.8, ease: 'sine.inOut', yoyo: true, repeat: -1 });                   // 重心微微摇晃
    const lay = [[bgPar, 6, 4], [midPar, 10, 6], [figPar, 14, 8], [dustPar, 26, 14]].map(([e, ax, ay]) => ({ qx: gsap.quickTo(e, 'x', { duration: 1.3, ease: 'power3' }), qy: gsap.quickTo(e, 'y', { duration: 1.3, ease: 'power3' }), ax, ay }));
    addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      lay.forEach((l) => { l.qx(-nx * l.ax); l.qy(-ny * l.ay); });
    }, { passive: true });
  }

  let prev = 0;
  gsap.ticker.add((time) => {
    const dt = Math.min(.05, time - prev); prev = time;
    if (!reduce) {
      drawDust(time, dt);
      // 背光跟着中央那团光一起呼吸，偶尔一闪
      const spike = Math.sin(Math.floor(time * 5) * 12.9898) * 43758.5453 % 1 > .9 ? .2 : 0;
      halo.style.opacity = (.32 + .1 * Math.sin(time * 1.1) + .05 * Math.sin(time * 2.9 + 1) + spike).toFixed(3);
    }
    stepRope(dt); drawRope(); stepSway(time);
  });

  addEventListener('resize', layout);
  layout();
  loaded.then(() => { placeFigure(); layout(); if (!reduce) startMotion(); });

  /* ---------- 分批加载的流程 ----------
     ① 先只有墙和人物在请求（约 0.6 MB）；② 它们到了，才放行海报、胶带、装饰（约 0.9 MB），并宣布 Scene.ready，首页的开场才开始放；
     ③ 海报到了（最多等 1.8 秒）再放行 22 张分镜，每张到货自己贴上去；④ 海报到齐后，一张张"啪"地拍上墙，站着的那位最后。 */
  const imgDone = (img) => new Promise((res) => { if (img.complete && img.naturalWidth) res(); else { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); } });
  const within = (pr, ms) => Promise.race([pr, new Promise((r) => setTimeout(r, ms))]);
  const group = (g) => late.filter((x) => x.group === g);
  const release = (items) => items.forEach((x) => { x.img.src = x.url; });
  const ready = within(Promise.all([imgDone(plate), imgDone(fig)]), 9000);
  ready.then(() => {
    release(group('poster'));
    const postersIn = within(Promise.all(posters.map((p) => imgDone(p.pp))), 3500);
    within(postersIn, 1800).then(() => {
      release(group('panel'));
      panels.forEach((p) => imgDone(p.im).then(() => { if (reduce) gsap.set(p.el, { opacity: 1 }); else enterPanel(p, Math.random() * .2); }));
    });
    postersIn.then(() => { if (reduce) posters.forEach((p) => { gsap.set(p.pst, { opacity: 1 }); gsap.set(p.tape, { opacity: 1 }); }); else slapOn(); });
  });

  // 给首页转场用
  window.Scene = { who: pick, ready: ready.then(() => {}), threadScreen, pull, hideThread() { thread.style.visibility = 'hidden'; }, handScreen() { const r = hand.getBoundingClientRect(); return { x: r.left, y: r.top }; } };
})();
