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
