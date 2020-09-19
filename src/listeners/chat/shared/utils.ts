export function parseCmdAndParam(cmdPrefix: string, message: string) {
  const sep = message.indexOf(' ');
  const cmd = message.substring(cmdPrefix.length, sep === -1 ? undefined : sep);
  const param = sep === -1 ? undefined : message.substring(sep + 1).trim() || undefined;
  return { cmd, param };
}
