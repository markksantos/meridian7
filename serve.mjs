import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const ROOT = process.cwd();
const TYPES = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.md':'text/markdown' };
createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const path = join(ROOT, normalize(url === '/' ? '/index.html' : url));
  if (!path.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream',
                         'Cache-Control': 'no-store', 'Content-Length': body.length });
    res.end(body);
  } catch { res.writeHead(404, {'Content-Length': 0}).end(); }
}).listen(6060, '127.0.0.1', () => console.log('meridian7 on http://localhost:6060'));
