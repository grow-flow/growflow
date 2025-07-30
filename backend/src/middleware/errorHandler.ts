import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] Unhandled error in ${req.method} ${req.path}:`, {
    error: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    requestBody: req.body,
    params: req.params,
    query: req.query
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details,
      timestamp
    });
  }

  if (err.name === 'EntityNotFoundError') {
    return res.status(404).json({
      error: 'Resource not found',
      timestamp
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      error: 'Database constraint violation',
      details: err.message,
      timestamp
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp
  });
};