import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import app from '../../src/server';

/**
 * Netlify Functions handler for the API Gateway
 */
const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Convert Netlify event to Express-compatible request
  const { httpMethod, path, queryStringParameters, headers, body } = event;
  
  return new Promise((resolve, reject) => {
    // Create mock request and response objects
    const req: any = {
      method: httpMethod,
      url: path,
      originalUrl: path,
      query: queryStringParameters || {},
      headers: headers || {},
      body: body ? JSON.parse(body) : {},
      ip: headers?.['x-forwarded-for']?.split(',')[0] || '127.0.0.1',
      connection: { remoteAddress: headers?.['x-forwarded-for']?.split(',')[0] || '127.0.0.1' },
    };

    const res: any = {
      statusCode: 200,
      headers: {},
      body: '',
      status: function(code: number) {
        this.statusCode = code;
        return this;
      },
      json: function(data: any) {
        this.headers['Content-Type'] = 'application/json';
        this.body = JSON.stringify(data);
        return this;
      },
      setHeader: function(name: string, value: string) {
        this.headers[name] = value;
        return this;
      },
      end: function(data?: any) {
        if (data) this.body = data;
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: this.body,
        });
      },
    };

    // Handle the request with Express app
    try {
      app(req, res);
    } catch (error) {
      reject(error);
    }
  });
};

export { handler };