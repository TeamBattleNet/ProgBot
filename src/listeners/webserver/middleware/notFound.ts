import { ProgbotError } from '../../../errors';

export function notFound() {
  throw new ProgbotError('NOT_FOUND', 'route not found');
}
