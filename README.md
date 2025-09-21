# IndyzAI API Gateway

A comprehensive TypeScript-based API Gateway application built with Node.js and Express, designed for deployment on Netlify Functions. This gateway provides authentication, rate limiting, request proxying, and comprehensive security features.

## 🚀 Features

### Core Functionality
- **TypeScript Support** - Full TypeScript implementation with strict type checking
- **Express.js Framework** - Robust and flexible web framework
- **Netlify Functions Ready** - Optimized for serverless deployment
- **Modular Architecture** - Clean separation of concerns with organized file structure

### Authentication & Authorization
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin, moderator, and user roles
- **Permission-based Authorization** - Granular permission system
- **API Key Authentication** - Support for API key-based access

### Security Features
- **Rate Limiting** - Multiple rate limiting strategies (IP-based, user-based, endpoint-specific)
- **CORS Configuration** - Flexible cross-origin resource sharing setup
- **Security Headers** - Helmet.js integration for security headers
- **Input Validation** - Joi-based request validation and sanitization
- **Request Logging** - Comprehensive request/response logging

### Proxy & Service Management
- **Service Proxying** - Forward requests to backend microservices
- **Load Balancing** - Distribute requests across multiple service instances
- **Retry Logic** - Automatic retry with exponential backoff
- **Service Health Monitoring** - Monitor backend service availability

### Monitoring & Observability
- **Health Checks** - Multiple health check endpoints
- **System Statistics** - Real-time system and service statistics
- **Error Handling** - Comprehensive error handling and reporting
- **Request Tracing** - Request ID tracking across services

## 📁 Project Structure

```
src/
├── config/           # Configuration management
├── middleware/       # Express middleware
│   ├── auth.ts      # Authentication middleware
│   ├── cors.ts      # CORS configuration
│   ├── rateLimiter.ts # Rate limiting
│   ├── security.ts  # Security headers and utilities
│   └── validation.ts # Input validation
├── routes/          # API route handlers
│   ├── admin.ts     # Admin management routes
│   ├── auth.ts      # Authentication routes
│   ├── health.ts    # Health check routes
│   ├── proxy.ts     # Proxy routes
│   └── index.ts     # Route aggregation
├── services/        # Business logic services
│   ├── authService.ts # Authentication service
│   └── proxyService.ts # Proxy service
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   ├── logger.ts    # Logging utilities
│   └── response.ts  # Response formatting
└── server.ts        # Main application entry point
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Netlify CLI (for deployment)

### Local Development

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Environment Configuration:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development server:**
```bash
npm run dev
```

The gateway will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:3000` |
| `USER_SERVICE_URL` | User service endpoint | Required |
| `PAYMENT_SERVICE_URL` | Payment service endpoint | Required |
| `NOTIFICATION_SERVICE_URL` | Notification service endpoint | Required |

### Service Configuration

Services can be configured in `src/config/index.ts` or dynamically via the admin API:

```typescript
const serviceConfig: ServiceConfig = {
  name: 'User Service',
  baseUrl: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  headers: {
    'Authorization': 'Bearer token'
  }
};
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/verify` - Verify JWT token

### Proxy Services
- `GET /api/proxy/services` - List available services
- `GET /api/proxy/users/*` - Proxy to user service
- `POST /api/proxy/payments/*` - Proxy to payment service (auth required)
- `POST /api/proxy/notifications/*` - Proxy to notification service (auth required)

### Administration (Admin Only)
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/permissions` - Update user permissions
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/services` - Get registered services
- `POST /api/admin/services` - Add new service
- `DELETE /api/admin/services/:name` - Remove service
- `GET /api/admin/stats` - System statistics

### Health & Monitoring
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with service status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## 🔐 Authentication

### Default Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@indyzai.com | Admin123! |
| User | user@indyzai.com | User123! |

### JWT Token Usage

Include the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-gateway.netlify.app/api/auth/me
```

### API Key Authentication

For service-to-service communication:

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
     https://your-gateway.netlify.app/api/proxy/users/1
```

## 🚀 Deployment

### Netlify Functions

1. **Build the project:**
```bash
npm run build
```

2. **Deploy to Netlify:**
```bash
netlify deploy --prod
```

3. **Set environment variables in Netlify dashboard**

### Environment Variables for Production

Ensure these are set in your Netlify environment:
- `JWT_SECRET` - Strong secret key
- `INTERNAL_API_KEY` - Internal service API key
- Service URLs and API keys for external services

## 📊 Rate Limiting

The gateway implements multiple rate limiting strategies:

- **General Limiter**: 100 requests per 15 minutes per IP/user
- **Auth Limiter**: 10 login attempts per 15 minutes
- **API Limiter**: 30 requests per minute for proxy endpoints
- **Strict Limiter**: 5 requests per 15 minutes for sensitive operations

## 🔍 Monitoring & Logging

### Request Logging
All requests are logged with:
- Request ID for tracing
- User information (if authenticated)
- Response time and status
- IP address and user agent

### Health Monitoring
- Basic health check at `/api/health`
- Detailed service health at `/api/health/detailed`
- System statistics at `/api/admin/stats`

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input Sanitization** - XSS protection
- **Rate Limiting** - DDoS protection
- **JWT Verification** - Secure authentication
- **Request Size Limiting** - Prevent large payloads

## 🧪 Testing

### Manual Testing

Use the provided HTML interface at the root URL or test endpoints directly:

```bash
# Health check
curl https://your-gateway.netlify.app/api/health

# Login
curl -X POST https://your-gateway.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@indyzai.com","password":"User123!"}'

# Proxy request
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-gateway.netlify.app/api/proxy/users/1
```

## 📈 Performance Considerations

- **Connection Pooling** - Reuse HTTP connections for backend services
- **Caching** - Implement response caching where appropriate
- **Compression** - Enable gzip compression for responses
- **Monitoring** - Track response times and error rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the example requests in the HTML interface

---

Built with ❤️ using TypeScript, Express.js, and Netlify Functions.