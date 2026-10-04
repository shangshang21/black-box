"""Approximate per-letter silhouette occlusion from paired CDP raster masks."""
import json
from pathlib import Path
from PIL import Image, ImageChops

shots = Path(__file__).resolve().parents[1] / 'gen/r7/shots'
rows = []
for path in sorted(shots.glob('R2-*-letters.json')):
    base = str(path).removesuffix('-letters.json')
    text = Image.open(base + '-text-mask.png').convert('L').point(lambda v: 255 if v > 128 else 0)
    alpha = Image.open(base + '-alpha-mask.png').convert('L').point(lambda v: 255 if v > 128 else 0)
    overlap = ImageChops.multiply(text, alpha)
    letters = []
    for item in json.loads(path.read_text()):
        r = item['rect']
        box = (max(0, int(r['left'])), max(0, int(r['top'])),
               min(text.width, int(r['right']) + 1), min(text.height, int(r['bottom']) + 1))
        total = text.crop(box).histogram()[255]
        hidden = overlap.crop(box).histogram()[255]
        letters.append({'letter': item['letter'], 'hiddenPercent': round(100 * hidden / max(1, total), 1)})
    rows.append({'capture': Path(base).name, 'letters': letters})
    print(Path(base).name, ', '.join(f"{x['letter']}: {x['hiddenPercent']}%" for x in letters))
(shots / 'review2-occlusion.json').write_text(json.dumps(rows, indent=2))
