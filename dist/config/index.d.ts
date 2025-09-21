interface Config {
    port: number;
    nodeEnv: string;
    jwt: {
        secret: string;
        expiresIn: string;
        issuer: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    cors: {
        origin: string[];
        credentials: boolean;
        optionsSuccessStatus: number;
    };
    services: {
        userService: string;
        paymentService: string;
        notificationService: string;
    };
    apiKeys: {
        stripe?: string;
        sendgrid?: string;
        internal: string;
    };
    security: {
        bcryptRounds: number;
        apiKeyHeader: string;
        authHeader: string;
    };
    logging: {
        level: string;
        format: string;
    };
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map