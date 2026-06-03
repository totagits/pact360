import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (payload) {
      req.user = payload;
      return next();
    }
  }

  return res.status(401).json({ error: 'Unauthorized. Access token is missing or expired.' });
}

export function requirePermission(permissionCode: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { role, permissions } = req.user;

    // Super Admin has bypass access to all modules
    if (role === 'Super Admin' || permissions.includes(permissionCode)) {
      return next();
    }

    return res.status(403).json({ error: `Forbidden. Required permission: ${permissionCode}` });
  };
}

export function requireAnyRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (roles.includes(req.user.role) || req.user.role === 'Super Admin') {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden. Access restricted to authorized roles.' });
  };
}
