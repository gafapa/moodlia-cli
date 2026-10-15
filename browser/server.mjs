import net from 'node:net';
import { timingSafeEqual } from 'node:crypto';

const commands = new Set(['open', 'status', 'tools', 'call', 'upload', 'download', 'close']);

export function createAuthenticatedServer({ token, execute, cleanup, maximumRequestBytes = 2 * 1024 * 1024,
  idleTimeout = 150000 }) {
  let queue = Promise.resolve();
  return net.createServer(socket => {
    socket.setEncoding('utf8');
    socket.setTimeout(idleTimeout, () => socket.destroy());
    let input = '';
    let received = 0;
    let handled = false;
    const reply = payload => {
      if (!socket.destroyed) socket.end(`${JSON.stringify(payload)}\n`);
    };
    socket.on('error', () => {});
    socket.on('data', chunk => {
      if (handled) return;
      received += Buffer.byteLength(chunk);
      if (received > maximumRequestBytes) {
        handled = true;
        reply({ ok: false, error: 'Browser request exceeds the configured byte limit; no tool was invoked.' });
        return;
      }
      input += chunk;
      const end = input.indexOf('\n');
      if (end < 0) return;
      handled = true;
      let request;
      try {
        request = JSON.parse(input.slice(0, end));
        if (!request || typeof request.token !== 'string'
            || Buffer.byteLength(request.token) !== Buffer.byteLength(token)
            || !timingSafeEqual(Buffer.from(request.token), Buffer.from(token))) {
          throw new Error('Unauthorized browser client.');
        }
        if (!commands.has(request.command)) throw new Error('Unsupported browser command.');
        if (request.parameters !== undefined && (!request.parameters || typeof request.parameters !== 'object'
            || Array.isArray(request.parameters))) throw new Error('Browser parameters must be an object.');
      } catch (error) {
        reply({ ok: false, error: error instanceof SyntaxError ? 'Invalid browser request JSON.' : error.message });
        return;
      }
      queue = queue.then(async () => {
        // Cancellation before execution must not start a queued mutation later.
        if (socket.destroyed) return;
        try {
          const result = request.command === 'close' ? { closed: true }
            : await execute(request.command, request.parameters || {});
          if (request.command === 'close') await cleanup();
          reply({ ok: true, result });
        } catch (error) { reply({ ok: false, error: error.message }); }
      }).catch(() => {});
    });
  });
}
