import pc from 'picocolors';

export const selectTheme = {
  style: {
    help: (text: string) => (text ? pc.dim(`(${text})`) : ''),
  },
};

export const selectInstructions = {
  navigation: 'Press ↑↓ to navigate, ⏎ to select, Ctrl+C to cancel',
  pager: 'Press ↑↓ to scroll',
};

export function withHelp(message: string, help: string = 'Ctrl+C to cancel') {
  return `${message} ${pc.dim(`(${help})`)}`;
}
