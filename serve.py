#!/usr/bin/env python3
"""开发用静态服务器：和 `python3 -m http.server` 一样，但不让浏览器缓存，
这样改了文件，刷新一下就是新的。用法：python3 serve.py [端口]"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3200
    ThreadingHTTPServer(('', port), NoCache).serve_forever()
