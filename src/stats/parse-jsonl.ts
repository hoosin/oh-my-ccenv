import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export interface Turn {
  ts: number;
  model: string;
  input: number;
  output: number;
  cache_write: number;
  cache_read: number;
  cwd: string;
  sessionId: string;
}

export async function parseJsonl(filePath: string, offset = 0): Promise<Turn[]> {
  const turns: Turn[] = [];

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding: 'utf-8', start: offset });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    rl.on('line', (line) => {
      if (!line.trim()) return;
      try {
        const msg = JSON.parse(line);
        if (msg.type !== 'assistant') return;
        if (!msg.message?.model || !msg.message?.usage) return;

        const ts = new Date(msg.timestamp).getTime();
        if (isNaN(ts)) return;

        const usage = msg.message.usage;
        turns.push({
          ts,
          model: msg.message.model,
          input: usage.input_tokens ?? 0,
          output: usage.output_tokens ?? 0,
          cache_write: usage.cache_creation_input_tokens ?? 0,
          cache_read: usage.cache_read_input_tokens ?? 0,
          cwd: msg.cwd ?? '',
          sessionId: msg.sessionId ?? '',
        });
      } catch (err) {
        // skip malformed lines
      }
    });

    rl.on('close', () => resolve(turns));
    rl.on('error', reject);
  });
}
