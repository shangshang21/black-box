#!/usr/bin/env python3
"""把"品红底的一张合集图"拆成一个个独立的透明小图（每个分镜 / 贴纸一张）。
先用品红抠像，再把互相分开的块找出来，各自裁出来。输出 WebP，并生成给网页用的清单。
用法：python3 split-sheet.py 输出目录 前缀 最大宽度 起始编号 合集1.png 合集2.png ...
清单会追加写入 输出目录/../panels.js（window.PANELS = [{f, ar}, ...]）"""
import sys, os, json, re, subprocess
from collections import deque
from PIL import Image, ImageFilter

out_dir, prefix, max_w, start = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
sheets = sys.argv[5:]
here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(out_dir, exist_ok=True)
items, idx = [], start
for sheet in sheets:
    tmp = '/tmp/_split_key.webp'
    subprocess.run([sys.executable, os.path.join(here, 'chroma-key.py'), sheet, tmp, '2000'], check=True, capture_output=True)
    im = Image.open(tmp).convert('RGBA'); W, H = im.size
    a = im.getchannel('A').point(lambda v: 255 if v > 30 else 0).filter(ImageFilter.MaxFilter(3))   # 只轻轻膨胀一点点：分镜本身是实心的，膨胀多了会把靠得近的两张粘成一张
    px = a.load(); seen = [[0] * W for _ in range(H)]; boxes = []
    for y0 in range(H):
        for x0 in range(W):
            if px[x0, y0] and not seen[y0][x0]:
                q = deque([(x0, y0)]); seen[y0][x0] = 1; x_min = x_max = x0; y_min = y_max = y0; n = 0
                while q:
                    x, y = q.popleft(); n += 1
                    x_min = min(x_min, x); x_max = max(x_max, x); y_min = min(y_min, y); y_max = max(y_max, y)
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < W and 0 <= ny < H and px[nx, ny] and not seen[ny][nx]:
                            seen[ny][nx] = 1; q.append((nx, ny))
                if n > 25000 and (x_max - x_min) > 120 and (y_max - y_min) > 120:
                    boxes.append((x_min, y_min, x_max, y_max))
    boxes.sort(key=lambda b: (b[1] // 260, b[0]))
    for b in boxes:
        c = im.crop((max(0, b[0] - 4), max(0, b[1] - 4), min(W, b[2] + 4), min(H, b[3] + 4)))
        if c.width > max_w: c = c.resize((max_w, round(c.height * max_w / c.width)), Image.LANCZOS)
        name = f'{prefix}-{idx:02d}.webp'; c.save(os.path.join(out_dir, name), quality=86, alpha_quality=100, method=6)
        items.append({'f': name, 'ar': round(c.width / c.height, 3)}); idx += 1
    print(os.path.basename(sheet), '→', len(boxes), '张')

lst = os.path.join(out_dir, '..', 'panels.js'); old = []
if os.path.exists(lst):
    m = re.search(r'=\s*(\[.*\])', open(lst, encoding='utf-8').read(), re.S)
    if m: old = json.loads(m.group(1))
new_names = {i['f'] for i in items}
old = [o for o in old if o['f'] not in new_names] + items          # 只替换同名的，其余旧的保留
open(lst, 'w', encoding='utf-8').write('window.PANELS = ' + json.dumps(old, ensure_ascii=False) + ';\n')
print('panels.js 共', len(old), '张')
