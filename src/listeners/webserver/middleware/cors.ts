import { Request, Response, NextFunction } from 'express';

export function cors(req: Request, res: Response, next: NextFunction) {
  if (req?.method?.toUpperCase?.() === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', '*');
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}
