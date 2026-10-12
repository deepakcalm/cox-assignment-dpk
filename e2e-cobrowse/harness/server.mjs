// Serves harness/index.html with Glance group/site injected from env.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.HARNESS_PORT ?? 4400);
const groupId = process.env.GLANCE_GROUP_ID ?? '';
const site = process.env.GLANCE_SITE ?? 'staging';

http
  .createServer((req, res) => {
    if (req.url === '/health') return res.end('ok');
    const html = fs
      .readFileSync(path.join(dir, 'index.html'), 'utf8')
      .replaceAll('__GLANCE_GROUP_ID__', groupId)
      .replaceAll('__GLANCE_SITE__', site);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  })
  .listen(port, () => console.log(`harness on http://localhost:${port}`));
