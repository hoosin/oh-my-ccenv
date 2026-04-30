import pc from 'picocolors';

export function info(msg: string) {
  console.log(pc.cyan('ℹ'), msg);
}

export function success(msg: string) {
  console.log(pc.green('✓'), msg);
}

export function warn(msg: string) {
  console.log(pc.yellow('⚠'), msg);
}

export function error(msg: string) {
  console.error(pc.red('✖'), msg);
}

const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export function spinner(msg: string): () => void {
  let i = 0;
  let running = true;
  const render = () => {
    process.stdout.write(`\r${pc.cyan(frames[i % frames.length])} ${msg}`);
    i++;
  };
  render();
  const timer = setInterval(() => {
    if (running) render();
  }, 80);
  return () => {
    running = false;
    clearInterval(timer);
    process.stdout.write('\r\x1b[K');
  };
}
