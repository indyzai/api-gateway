import { Response } from 'express';
import { ApiResponse, ErrorResponse } from '../types';
export declare const createResponse: <T = any>(success: boolean, message: string, data?: T, error?: string, requestId?: string) => ApiResponse<T>;
export declare const sendSuccess: <T = any>(res: Response, message: string, data?: T, statusCode?: number, requestId?: string) => Response;
export declare const sendError: (res: Response, message: string, error?: string, statusCode?: number, requestId?: string) => Response;
export declare const sendValidationError: (res: Response, errors: any, requestId?: string) => Response;
export declare const createErrorResponse: (message: string, error: string, requestId?: string, stack?: string) => ErrorResponse;
//# sourceMappingURL=response.d.ts.map