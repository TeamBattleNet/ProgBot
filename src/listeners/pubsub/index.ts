import { TwitchEventClient } from './twitchEvents.js';
import { styleChange } from './styleChange.js';

export function initializeChannelPointHandlers() {
  TwitchEventClient.registerChannelPointHandler(styleChange);
}
