import { ChatContext } from './common';

const EMOTE_MAP: { [emote: string]: { [chatType: string]: string } } = {
  ProgChamp: { discord: '<:ProgChamp:281409807754461184>', twitch: 'ProgChamp' },
  TalkToMom: { discord: '<:TalkToMom:281412663072784385>', twitch: 'TalkToMom' },
  TalkToDad: { discord: '<:TalkToDad:281412643305029632>', twitch: 'TalkToDad' },
  PawnChamp: { discord: '<:Pawn1:279167434613719041><:Pawn2:279167464515043328>', twitch: 'PawnChamp' },
  NumberBrain: { discord: '<:NumberBrain:584920179507724308>', twitch: 'NumberBrain' },
  MoZenny: { discord: '<:MoZenny:430603785442820105>', twitch: 'MoZenny' },
  BathroomSplits: { discord: '<:BathroomSplits:590773382954614797>', twitch: 'BathroomSplits' },
};

// Take a string and trim the first space separated word and return this word and the remainder
// preTrimLength trims the first N chars from the str input off of the returned 'word' (for cmdPrefix)
export function parseNextWord(str: string, preTrimLength = 0) {
  const sep = str.indexOf(' ');
  const word = str.substring(preTrimLength, sep === -1 ? undefined : sep);
  const remain = sep === -1 ? undefined : str.substring(sep + 1).trim() || undefined;
  return { word, remain };
}

// Wraps a string with backticks (`) if discord or single quotes (') if twitch
export function wrap(ctx: ChatContext, str?: string) {
  if (ctx.chatType === 'discord') return `\`${str}\``;
  return `'${str}'`;
}

// Gets corresponding emote string for twitch or discord
// Returns an empty string if requested emote does not exist
export function getEmote(ctx: ChatContext, emote: string) {
  const emotes = EMOTE_MAP[emote];
  if (!emotes) return '';
  return emotes[ctx.chatType] || '';
}
