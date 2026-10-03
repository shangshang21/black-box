#!/usr/bin/env python3
"""品红底（#FF00FF）黑白线稿 → 带透明通道的 WebP。
头发丝之间的缝隙也是品红，所以能抠得很干净；边缘的半透明像素会"反混合"，去掉品红色边。
假设：人物本身是黑白灰 + 少量红色点缀（没有蓝/紫色）。
用法：python3 chroma-key.py in.png out.webp [最大高度]"""
import sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
max_h = int(sys.argv[3]) if len(sys.argv) > 3 else 1100
im = Image.open(src).convert('RGB')
if im.height > max_h:
    im = im.resize((round(im.width * max_h / im.height), max_h), Image.LANCZOS)

# 背景不是绝对均匀的（GPT 画的"纯品红"每处略有差别），所以先从画面边缘量出背景的"品红程度"，再据此定阈值
W, H = im.size
px = im.load()
border = sorted(min(px[x, y][0], px[x, y][2]) - px[x, y][1]
                for x in range(W) for y in (0, 1, 2, H - 3, H - 2, H - 1)) + \
         sorted(min(px[x, y][0], px[x, y][2]) - px[x, y][1] for y in range(H) for x in (0, 1, 2, W - 3, W - 2, W - 1))
bg_m = sorted(border)[len(border) // 2]      # 背景的品红程度（中位数，约 245）
cut = bg_m - 30                               # 品红程度超过它的，一律当背景，避免残留一层淡淡的方框

out = []
for r, g, b in im.getdata():
    m = min(r, b) - g                         # 品红程度：背景约 bg_m，灰色 0，红色点缀 0
    if m <= 6:                                # 不是品红：完全不透明
        out.append((r, g, b, 255)); continue
    if m >= cut:
        out.append((0, 0, 0, 0)); continue
    a = (cut - m) / (cut - 6)                 # 透明度：品红越多越透明
    bgf = min(1.0, m / bg_m)                  # 这个像素里混进了多少背景
    k = 1 - bgf
    out.append(tuple(max(0, min(255, round(v))) for v in ((r - bgf * 255) / k, g / k, (b - bgf * 255) / k)) + (round(a * 255),))
res = Image.new('RGBA', im.size); res.putdata(out)
res.save(dst, quality=92, method=6)
print(dst, res.size, 'bg_m =', bg_m)
