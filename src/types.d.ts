export interface ConfigFile {
  database: string;
  webserver_bind: string;
  webserver_port: number;
  discord_token: string;
  discord_bot_cmd_prefix: string;
  twitch_app_client_id: string;
  twitch_app_client_secret: string;
  twitch_bot_access_token: string;
  twitch_bot_refresh_token: string;
  twitch_bot_cmd_prefix: string;
  url_base: string;
}

export type CommandCategory = 'Accounts' | 'Help' | 'General' | 'Simple' | 'Admin' | 'Channel';

export type ChipElement = 'none' | 'aqua' | 'wind' | 'elec' | 'wood' | 'fire' | 'obj' | 'recov' | 'break' | 'sword' | 'invis' | 'num' | 'search' | 'ground';
export type ChipCategory = 'std' | 'mega' | 'navi' | 'giga' | 'dark';
export type StyleType =
  | 'Normal Style'
  | 'Hub Style'
  | 'Dark Soul'
  | 'ElecGuts Style'
  | 'HeatGuts Style'
  | 'AquaGuts Style'
  | 'WoodGuts Style'
  | 'ElecCustom Style'
  | 'HeatCustom Style'
  | 'AquaCustom Style'
  | 'WoodCustom Style'
  | 'ElecTeam Style'
  | 'HeatTeam Style'
  | 'AquaTeam Style'
  | 'WoodTeam Style'
  | 'ElecShield Style'
  | 'HeatShield Style'
  | 'AquaShield Style'
  | 'WoodShield Style'
  | 'ElecGround Style'
  | 'HeatGround Style'
  | 'AquaGround Style'
  | 'WoodGround Style'
  | 'ElecShadow Style'
  | 'HeatShadow Style'
  | 'AquaShadow Style'
  | 'WoodShadow Style'
  | 'ElecBug Style'
  | 'HeatBug Style'
  | 'AquaBug Style'
  | 'WoodBug Style'
  | 'Guts Soul'
  | 'Fire Soul'
  | 'Roll Soul'
  | 'Wind Soul'
  | 'Thunder Soul'
  | 'Search Soul'
  | 'Aqua Soul'
  | 'Number Soul'
  | 'Wood Soul'
  | 'Metal Soul'
  | 'Junk Soul'
  | 'Proto Soul'
  | 'Magnet Soul'
  | 'Gyro Soul'
  | 'Napalm Soul'
  | 'Meddy Soul'
  | 'Knight Soul'
  | 'Shadow Soul'
  | 'Tomahawk Soul'
  | 'Toad Soul'
  | 'Colonel Soul'
  | 'Magnet Chaos'
  | 'Gyro Chaos'
  | 'Napalm Chaos'
  | 'Search Chaos'
  | 'Meddy Chaos'
  | 'Proto Chaos'
  | 'Knight Chaos'
  | 'Shadow Chaos'
  | 'Tomahawk Chaos'
  | 'Number Chaos'
  | 'Toad Chaos'
  | 'Colonel Chaos'
  | 'Heat Cross'
  | 'Elec Cross'
  | 'Slash Cross'
  | 'Erase Cross'
  | 'Charge Cross'
  | 'Spout Cross'
  | 'Tomahawk Cross'
  | 'Tengu Cross'
  | 'Ground Cross'
  | 'Dust Cross'
  | 'Heat Beast'
  | 'Elec Beast'
  | 'Slash Beast'
  | 'Erase Beast'
  | 'Charge Beast'
  | 'Spout Beast'
  | 'Tomahawk Beast'
  | 'Tengu Beast'
  | 'Ground Beast'
  | 'Dust Beast';
