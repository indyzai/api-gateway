import { Request, Response, NextFunction } from 'express';
import { ValidationSchema } from '../types';
export declare const validate: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const schemas: any;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map