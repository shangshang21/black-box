#!/usr/bin/env python3
"""重新生成自托管字体。页面里新增了汉字（比如结局的台词）后运行一次：python3 tools/build-fonts.py
做法：扫描 v2 里所有文件用到的汉字 → 向 Google Fonts 要一份只含这些字的 Noto Serif SC 600 子集 → 存到 v2/fonts/。
Anton / Space Mono 的拉丁字母子集不用重做。"""
import re, os, subprocess, time, urllib.parse, glob
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'v2')
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
chars = set()
for f in glob.glob(ROOT + '/*.html') + glob.glob(ROOT + '/*.js') + glob.glob(ROOT + '/*.css'):
    chars |= set(re.findall(r'[　-〿一-鿿＀-￯]', open(f, encoding='utf-8').read()))
text = ''.join(sorted(chars)) + '0123456789'
url = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600&text=' + urllib.parse.quote(text)
def curl(u, out=None):
    for _ in range(5):
        r = subprocess.run(['curl', '-s', '--http1.1', '-m', '60', '-A', UA] + (['-o', out] if out else []) + [u], capture_output=True)
        if r.returncode == 0 and (out or r.stdout): return r.stdout
        time.sleep(1.5)
    raise SystemExit('下载失败：' + u)
css = curl(url).decode()
woff = re.search(r'url\((https://[^)]+)\)', css).group(1)
out = os.path.join(ROOT, 'fonts', 'NotoSerifSC-600-subset.woff2'); curl(woff, out)
print(len(chars), '个汉字 →', out, os.path.getsize(out), 'bytes')
