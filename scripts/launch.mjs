import { createServer } from 'vite';
import { spawn } from 'node:child_process';
const url = 'http://127.0.0.1:5178/';
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
  const html = await response.text();
  if (!html.includes('Mik Mik — Ember & Crumb'))
    throw new Error('5178 numaralı port başka bir uygulama tarafından kullanılıyor.');
  spawn('open', [url], { stdio: 'ignore' }).unref();
  console.log(`Mik Mik zaten açık: ${url}`);
} catch (error) {
  if (!['TypeError', 'TimeoutError'].includes(error.name)) {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    const server = await createServer({
      server: { host: '127.0.0.1', port: 5178, strictPort: true, open: true },
    });
    await server.listen();
    server.printUrls();
    console.log('Bu pencere açık kaldığı sürece oyun çalışır. Durdurmak için Ctrl+C.');
  }
}
