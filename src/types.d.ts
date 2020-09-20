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
}

export type CommandCategory = 'Accounts' | 'Help' | 'General' | 'Simple' | 'Admin';

export type ChipElement = 'none' | 'aqua' | 'wind' | 'elec' | 'wood' | 'fire' | 'obj' | 'recov' | 'break' | 'sword' | 'invis' | 'num' | 'search' | 'ground';
export type ChipCategory = 'std' | 'mega' | 'navi' | 'giga' | 'dark';
