import { readFileSync, promises as fspromise } from 'fs';
import { ConfigFile } from '../types';

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

  public static async updateTwitchAuthTokens(botAccessToken: string, botRefreshToken: string) {
    const currentConf = Config.getConfig();
    currentConf.twitch_bot_access_token = botAccessToken;
    currentConf.twitch_bot_refresh_token = botRefreshToken;
    Config.configCache = currentConf;
    await fspromise.writeFile(CONFIG_FILE_PATH, JSON.stringify(currentConf, null, 2), 'utf8');
  }
}
