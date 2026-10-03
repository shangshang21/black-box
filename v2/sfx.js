/* 很轻的实体音效：纸的"啪"、低沉的"咚"、划过的"嗖"。全部用 WebAudio 合成，没有音频文件；
   浏览器要求先有用户操作才能出声，所以第一次点击之后才会响。 */
window.SFX = (() => {
  let ctx;
  const get = () => { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  const noise = (c, dur, power) => {
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, power);
    return buf;
  };
  const safe = (fn) => (...a) => { try { fn(...a); } catch (e) { /* 没有音频就算了 */ } };

  const snap = safe((v = .16) => {                      // 纸的"啪"：一小撮高频噪声
    const c = get(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noise(c, .07, 3); f.type = 'highpass'; f.frequency.value = 1600; g.gain.value = v;
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  });
  const thud = safe((v = .3) => {                       // 低沉的"咚"：正弦波快速下滑
    const c = get(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + .18);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .22);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + .24);
  });
  const whoosh = safe((v = .14) => {                    // 划过的"嗖"：带通滤波的噪声，频率扫上去
    const c = get(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    s.buffer = noise(c, .4, 1.5); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5200, t + .32);
    g.gain.value = v; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  });
  return { snap, thud, whoosh };
})();
