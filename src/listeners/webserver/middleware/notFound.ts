import { ProgbotError } from '../../../errors.js';

export function notFound() {
  throw new ProgbotError('NOT_FOUND', 'route not found');
}
