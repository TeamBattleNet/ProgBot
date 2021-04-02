import { Config } from './clients/configuration';
import { StyleType } from './types';

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const styles: StyleType[] = ['placeholderStyle1', 'placeholderStyle2', 'placeholderStyle3'];
export function getRandomStyle(): StyleType {
  return styles[Math.floor(Math.random() * styles.length)];
}

export function getRedirectURI() {
  let redirectURIBase = Config.getConfig().url_base;
  // trim trailing '/' chars
  while (redirectURIBase.endsWith('/')) redirectURIBase = redirectURIBase.substring(0, redirectURIBase.length - 1);
  return `${redirectURIBase}/v1/twitch_oauth`;
}
