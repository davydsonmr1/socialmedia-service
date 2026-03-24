// =====================================================
// LinkedBridge — Require Auth Middleware (JWT Session)
// =====================================================
// Protects SaaS dashboard routes with JWT-based
// session authentication.
//
// The JWT is stored in an HttpOnly cookie:
// - Production: `__Host-saas_session` (Secure + Path=/)
// - Development: `saas_session` (http://localhost compat)
//
// INFOSEC:
// - HttpOnly prevents JavaScript access (XSS mitigation)
// - SameSite prevents CSRF on dashboard routes
// - Token expiry is validated by @fastify/jwt automatically
// =====================================================

import type { FastifyReply, FastifyRequest } from 'fastify';

// ─── Environment-Aware Cookie Name ───
const IS_PRODUCTION = process.env['NODE_ENV'] === 'production';
const SESSION_COOKIE_NAME = IS_PRODUCTION ? '__Host-saas_session' : 'saas_session';

// Extend Fastify's type system so `request.user` contains our JWT payload
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

/**
 * Fastify preHandler hook that validates the SaaS session JWT.
 *
 * Flow:
 * 1. Extract JWT from the session cookie
 * 2. Verify signature + expiry via @fastify/jwt
 * 3. Inject `request.user.sub` (userId) for downstream handlers
 * 4. Reject with 401 if missing/invalid/expired
 */
export async function requireAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies[SESSION_COOKIE_NAME];

  if (!token) {
    request.log.warn('[RequireAuth] Missing session cookie');
    void reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
      },
    });
    return;
  }

  try {
    // Manually verify the token extracted from the cookie
    // since the cookie name is environment-dependent.
    const decoded = request.server.jwt.verify<{ sub: string }>(token);
    request.user = decoded;
  } catch (error: unknown) {
    request.log.warn(
      { err: error },
      '[RequireAuth] Invalid or expired session token',
    );
    void reply.status(401).send({
      error: {
        code: 'SESSION_EXPIRED',
        message: 'Your session has expired. Please log in again.',
      },
    });
    return;
  }
}
