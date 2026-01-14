import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma errors
  if (err.message.includes('Unique constraint')) {
    statusCode = 400;
    message = 'Resource already exists';
  }

  // JWT errors
  if (err.message.includes('jwt')) {
    statusCode = 401;
    message = 'Invalid token';
  }

  console.error(`Error ${statusCode}: ${message}`);
  console.error(err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};