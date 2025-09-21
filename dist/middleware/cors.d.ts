import cors from 'cors';
import { Request } from 'express';
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare const handlePreflight: (req: Request, res: any, next: any) => any;
//# sourceMappingURL=cors.d.ts.map