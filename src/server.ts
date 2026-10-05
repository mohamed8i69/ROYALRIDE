import { AngularAppEngine, createRequestHandler } from '@angular/ssr';
import {
  getAllowedHosts,
  getContext,
  getTrustProxyHeaders,
} from '@netlify/angular-runtime/app-engine.js';

const backendApiUrl = process.env['BACKEND_API_URL'] || 'https://dashboard-nine-flame-50.vercel.app';

const angularAppEngine = new AngularAppEngine({
  allowedHosts: getAllowedHosts(),
  trustProxyHeaders: getTrustProxyHeaders(),
});

/**
 * Proxy /api requests to the Express Dashboard backend.
 */
async function proxyApiRequest(request: Request, url: URL): Promise<Response> {
  try {
    const headers = new Headers(request.headers);
    headers.delete('host');

    const response = await fetch(`${backendApiUrl}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('transfer-encoding');
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    console.error('SSR API Proxy Error:', error);
    return Response.json({ message: 'Backend service unavailable.' }, { status: 502 });
  }
}

/**
 * Request handler used by Netlify to render the Angular application.
 */
export async function netlifyAppEngineHandler(request: Request): Promise<Response> {
  const context = getContext();

  const url = new URL(request.url);
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    return proxyApiRequest(request, url);
  }

  const result = await angularAppEngine.handle(request, context);
  return result || new Response('Not found', { status: 404 });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createRequestHandler(netlifyAppEngineHandler);
