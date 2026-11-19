"""本機預覽伺服器：python tools/serve.py [port] [目錄]
Windows 內建 http.server 會把 .mjs 當 text/plain，導致 ES Module 載入失敗；這裡補正 MIME 並關閉快取。
"""
import http.server, sys, functools, os

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".mjs": "text/javascript", ".js": "text/javascript", ".webp": "image/webp", ".json": "application/json"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

port = int(os.environ.get("PORT") or (sys.argv[1] if len(sys.argv) > 1 else 8766))
root = sys.argv[2] if len(sys.argv) > 2 else "."
http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=root)).serve_forever()
