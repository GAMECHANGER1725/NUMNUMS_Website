import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const PORT = process.env.PORT || 4000;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.mp4':  'video/mp4',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

createServer((req, res) => {
  const urlParts = req.url.split('?');
  const query = urlParts[1] ? `?${urlParts[1]}` : '';
  let urlPath = decodeURIComponent(urlParts[0]);

  // Mirror netlify.toml: `.html` is never a canonical URL. 301 it to the clean
  // form so local testing hits the same URLs Google sees. Without this, every
  // canonical/sitemap/card link (/blog/<slug>) 404s locally and the routine
  // ends up "verifying" .html URLs that redirect in production.
  if (urlPath.endsWith('.html')) {
    const clean = urlPath.endsWith('/index.html')
      ? urlPath.slice(0, -'index.html'.length)   // /blog/index.html → /blog/
      : urlPath.slice(0, -'.html'.length);       // /blog/slug.html  → /blog/slug
    res.writeHead(301, { Location: clean + query });
    res.end();
    return;
  }

  let filePath = join(ROOT, urlPath);

  // Root → index.html
  if (urlPath === '/') {
    filePath = join(ROOT, 'index.html');
  }
  // Directory → serve index.html
  else if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }
  // Clean URL → <path>.html on disk
  else if (!extname(filePath) && existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
  });

  createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log(`Num Nums Bakery dev server running at http://localhost:${PORT}`);
});
