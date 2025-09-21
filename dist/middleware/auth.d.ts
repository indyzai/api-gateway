import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const authenticateJWT: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authenticateAPIKey: (req: Request, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authorize: (roles?: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requirePermission: (permission: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map