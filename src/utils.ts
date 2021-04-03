import { Config } from './clients/configuration';
import { StyleType } from './types';

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const styles: StyleType[] = [
  'ElecGuts Style',
  'HeatGuts Style',
  'AquaGuts Style',
  'WoodGuts Style',
  'ElecCustom Style',
  'HeatCustom Style',
  'AquaCustom Style',
  'WoodCustom Style',
  'ElecTeam Style',
  'HeatTeam Style',
  'AquaTeam Style',
  'WoodTeam Style',
  'ElecShield Style',
  'HeatShield Style',
  'AquaShield Style',
  'WoodShield Style',
  'ElecGround Style',
  'HeatGround Style',
  'AquaGround Style',
  'WoodGround Style',
  'ElecShadow Style',
  'HeatShadow Style',
  'AquaShadow Style',
  'WoodShadow Style',
  'ElecBug Style',
  'HeatBug Style',
  'AquaBug Style',
  'WoodBug Style',
  'Guts Soul',
  'Fire Soul',
  'Roll Soul',
  'Wind Soul',
  'Thunder Soul',
  'Search Soul',
  'Aqua Soul',
  'Number Soul',
  'Wood Soul',
  'Metal Soul',
  'Junk Soul',
  'Proto Soul',
  'Magnet Soul',
  'Gyro Soul',
  'Napalm Soul',
  'Meddy Soul',
  'Knight Soul',
  'Shadow Soul',
  'Tomahawk Soul',
  'Toad Soul',
  'Colonel Soul',
  'Magnet Chaos',
  'Gyro Chaos',
  'Napalm Chaos',
  'Search Chaos',
  'Meddy Chaos',
  'Proto Chaos',
  'Knight Chaos',
  'Shadow Chaos',
  'Tomahawk Chaos',
  'Number Chaos',
  'Toad Chaos',
  'Colonel Chaos',
  'Heat Cross',
  'Elec Cross',
  'Slash Cross',
  'Erase Cross',
  'Charge Cross',
  'Spout Cross',
  'Tomahawk Cross',
  'Tengu Cross',
  'Ground Cross',
  'Dust Cross',
  'Heat Beast',
  'Elec Beast',
  'Slash Beast',
  'Erase Beast',
  'Charge Beast',
  'Spout Beast',
  'Tomahawk Beast',
  'Tengu Beast',
  'Ground Beast',
  'Dust Beast',
];
export function getRandomStyle(): StyleType {
  return styles[Math.floor(Math.random() * styles.length)];
}

export function getRedirectURI() {
  let redirectURIBase = Config.getConfig().url_base;
  // trim trailing '/' chars
  while (redirectURIBase.endsWith('/')) redirectURIBase = redirectURIBase.substring(0, redirectURIBase.length - 1);
  return `${redirectURIBase}/v1/twitch_oauth`;
}
