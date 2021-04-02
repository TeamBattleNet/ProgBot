import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../../../logger';

const logger = getLogger('webserver_error_handler');

function getError(err: any) {
  const returnError = { code: err.code, error: err.message };
  switch (err.code) {
    case 'BAD_REQUEST':
      return { httpStatusCode: 400, returnError };
    case 'NOT_FOUND':
      return { httpStatusCode: 404, returnError };
    default:
      return { httpStatusCode: 500, returnError: { code: 'INTERNAL_SERVER_ERROR', error: 'An unexpected error occurred' } };
  }
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err) {
    logger.error(`${req.originalUrl}: ${err}`);
    const { httpStatusCode, returnError } = getError(err);
    return res.status(httpStatusCode).send(returnError);
  }
  return next();
}
