import { presets } from '../config/presets.js';
import pc from 'picocolors';

export async function providersCommand(): Promise<void> {
  console.log(pc.dim('Provider      Description'));
  for (const p of presets) {
    console.log(`${p.id.padEnd(12)}  ${p.description}`);
  }
}