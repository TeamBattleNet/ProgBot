import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../../../logger';

const logger = getLogger('webserver_error_handler');

function getError(err: any) {
  const returnError = { code: err.code, error: err.message };
  switch (err.code) {
    case 'NOT_FOUND':
      return { httpStatusCode: 404, returnError };
    default:
      return { httpStatusCode: 500, returnError: { code: 'INTERNAL_SERVER_ERROR', error: 'An unexpected error occurred' } };
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
  if (err) {
    logger.error(err);
    const { httpStatusCode, returnError } = getError(err);
    return res.status(httpStatusCode).send(returnError);
  }
  return next();
}
