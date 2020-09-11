import { registerCommonChatBotHandler } from './shared/common';
import { ping } from './shared/ping';

export function initializeChatBotHandlers() {
  registerCommonChatBotHandler('ping', 'Check if I am online', 'usage: ping', ping);
}
