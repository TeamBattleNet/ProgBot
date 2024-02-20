import { readFileSync, promises as fspromise } from 'node:fs';
import type { AccessToken } from '@twurple/auth';
import { ConfigFile } from '../types.js';

const CONFIG_FILE_PATH = 'runtime/config.json';

export class Config {
  public static configCache?: ConfigFile = undefined;

  public static getConfig() {
    if (!Config.configCache) Config.reloadConfig();
    return Config.configCache as ConfigFile;
  }

  public static reloadConfig() {
    Config.configCache = JSON.parse(readFileSync(CONFIG_FILE_PATH, 'utf8'));
  }

  public static async updateTwitchAuthToken(_userId: string, newToken: AccessToken) {
    const currentConf = Config.getConfig();
    currentConf.twitch_bot_access_token = newToken.accessToken;
    currentConf.twitch_bot_refresh_token = newToken.refreshToken || '';
    Config.configCache = currentConf;
    await fspromise.writeFile(CONFIG_FILE_PATH, JSON.stringify(currentConf, null, 2), 'utf8');
  }
}
