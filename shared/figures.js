// 成员剪影。坐标系 200 宽，头顶约在 y=36，身体一直延伸到 y=900。
// 半身像用 viewBox 高 300 裁切，全身像（列队）用 900。
(function () {
  const BODY =
    'M100,36 C124,36 140,54 140,80 C140,98 137,110 130,120 C126,126 120,131 114,134 L114,150 ' +
    'C130,158 168,166 184,184 C192,194 196,214 197,240 L194,520 L192,900 L8,900 L6,520 L3,240 ' +
    'C4,214 8,194 16,184 C32,166 70,158 86,150 L86,134 C80,131 74,126 70,120 C63,110 60,98 60,80 ' +
    'C60,54 76,36 100,36Z';

  // Luna：长发 + 新月发饰
  const LUNA_HAIR =
    'M100,26 C136,26 154,52 153,88 C152,122 158,156 174,186 C156,190 138,182 128,170 L128,110 ' +
    'L72,110 L72,170 C62,182 44,190 26,186 C42,156 48,122 47,88 C46,52 64,26 100,26Z';
  const LUNA_MOON = 'M163.23,52.58 A14,14 0 1,1 147.88,34.16 A12,12 0 0,0 163.23,52.58Z';

  // Hound：兜帽 + 两只垂下来的猎犬耳朵
  const HOUND =
    'M100,20 C128,20 150,42 157,70 C163,100 158,128 148,142 C166,152 184,164 190,186 ' +
    'C195,204 197,222 197,240 L194,520 L192,900 L8,900 L6,520 L3,240 C3,222 5,204 10,186 ' +
    'C16,164 34,152 52,142 C42,128 37,100 43,70 C50,42 72,20 100,20Z';
  const HOUND_EARS =
    '<ellipse cx="41" cy="100" rx="15" ry="38" transform="rotate(14 41 100)"/>' +
    '<ellipse cx="159" cy="100" rx="15" ry="38" transform="rotate(-14 159 100)"/>';

  // 武器大师：背上交叉的两把剑，剑柄从两肩后露出来
  const HILT = '<circle cx="0" cy="-70" r="8"/><rect x="-6" y="-64" width="12" height="60"/><rect x="-26" y="-6" width="52" height="10"/><rect x="-8" y="4" width="16" height="60"/>';
  const SMITH_EXTRA =
    `<g transform="translate(160 150) rotate(24)">${HILT}</g>` +
    `<g transform="translate(40 150) rotate(-24)">${HILT}</g>`;

  const shapes = {
    base: `<path d="${BODY}"/>`,
    luna: `<path d="${BODY}"/><path d="${LUNA_HAIR}"/><path d="${LUNA_MOON}"/>`,
    hound: `<path d="${HOUND}"/>${HOUND_EARS}`,
    smith: `<path d="${BODY}"/>${SMITH_EXTRA}`,
    unknown: `<path d="${BODY}"/>`,
  };

  window.FIG = {
    shapes,
    // kind: base|luna|hound|smith|unknown；h: 300 半身 / 900 全身
    svg(kind, { h = 300, attrs = '' } = {}) {
      return `<svg viewBox="0 0 200 ${h}" preserveAspectRatio="xMidYMin meet" ${attrs}>${shapes[kind]}</svg>`;
    },
  };
})();
