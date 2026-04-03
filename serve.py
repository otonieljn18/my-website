import http.server, os, sys
os.chdir('/Users/or/Documents/Projects/my-website')
port = int(os.environ.get('PORT', 3456))
handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(('', port), handler)
print(f'Serving on http://localhost:{port}', flush=True)
httpd.serve_forever()
