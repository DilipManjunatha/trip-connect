import { Response } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: Function
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  next();
};

/**
 * Middleware to check if user is admin OR the resource owner
 */
export const requireAdminOrOwner = (getOwnerId: (req: AuthRequest) => string | null) => {
  return (req: AuthRequest, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admins can access anything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Check if user is the owner
    const ownerId = getOwnerId(req);
    if (ownerId && ownerId === req.user.id) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to access this resource.'
    });
  };
};
