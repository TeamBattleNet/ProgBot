import { TwitchEventClient } from './twitchEvents';
import { styleChange } from './styleChange';

export function initializeChannelPointHandlers() {
  TwitchEventClient.registerChannelPointHandler(styleChange);
}
