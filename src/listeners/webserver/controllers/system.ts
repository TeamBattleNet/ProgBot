import { Request, Response } from 'express';
import { asyncHandler } from './helpers.js';

/**
 * GET /health
 * Health check endpoint (is it running)
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => res.status(200).send('OK'));
