import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  jwt: {
    secret: string;
    expiresIn: number;
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

const config: Config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN_HOURS || '24'), // in hours
    issuer: process.env.JWT_ISSUER || 'IndyzAI-Gateway',
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
  },
  
  // Backend Services Configuration
  services: {
    userService: process.env.USER_SERVICE_URL || 'https://jsonplaceholder.typicode.com',
    paymentService: process.env.PAYMENT_SERVICE_URL || 'https://api.stripe.com',
    notificationService: process.env.NOTIFICATION_SERVICE_URL || 'https://api.sendgrid.com',
  },
  
  // API Keys
  apiKeys: {
    stripe: process.env.STRIPE_API_KEY,
    sendgrid: process.env.SENDGRID_API_KEY,
    internal: process.env.INTERNAL_API_KEY || 'default-internal-key',
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
    apiKeyHeader: 'x-api-key',
    authHeader: 'authorization',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
  },
};

export default config;