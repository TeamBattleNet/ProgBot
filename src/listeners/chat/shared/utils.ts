import { ChatContext } from './common';

export function parseCmdAndParam(cmdPrefix: string, message: string) {
  const sep = message.indexOf(' ');
  const cmd = message.substring(cmdPrefix.length, sep === -1 ? undefined : sep);
  const param = sep === -1 ? undefined : message.substring(sep + 1).trim() || undefined;
  return { cmd, param };
}

// Wraps a string with backticks (`) if discord or single quotes (') if twitch
export function wrap(ctx: ChatContext, str?: string) {
  if (ctx.chatType === 'discord') return `\`${str}\``;
  return `'${str}'`;
}
