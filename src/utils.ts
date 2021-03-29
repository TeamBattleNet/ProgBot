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
