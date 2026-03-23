// =====================================================
// LinkedBridge — Server Bootstrap
// =====================================================
// This is the Composition Root (main/server.ts).
// It wires all dependencies together and starts the
// Fastify HTTP server.
//
// Dependency Injection is performed manually here —
// no DI container needed for this scale.
// =====================================================

import 'dotenv/config';

import { buildApp } from '../infra/http/app.js';
import { registerOAuthRoutes } from '../infra/http/routes/oauth.routes.js';

// Infrastructure
import { AesGcmCryptoService } from '../infra/crypto/aes-gcm.service.js';
import { LinkedInGateway } from '../infra/gateways/linkedin/linkedin.gateway.js';

// Use Cases
import { GenerateOAuthUrlUseCase } from '../application/use-cases/generate-oauth-url.usecase.js';
import { ProcessOAuthCallbackUseCase } from '../application/use-cases/process-oauth-callback.usecase.js';

// Controllers
import { OAuthController } from '../infra/http/controllers/oauth.controller.js';

const PORT = Number(process.env['PORT']) || 3333;
const HOST = process.env['HOST'] || '0.0.0.0';

async function bootstrap(): Promise<void> {
  // ─── 1. Build the Fastify App (with security plugins) ───
  const app = await buildApp();

  // ─── 2. Instantiate Infrastructure Services ───
  const cryptoService = new AesGcmCryptoService();

  const linkedInGateway = new LinkedInGateway({
    clientId: process.env['LINKEDIN_CLIENT_ID'] ?? '',
    clientSecret: process.env['LINKEDIN_CLIENT_SECRET'] ?? '',
    redirectUri: process.env['LINKEDIN_REDIRECT_URI'] ?? '',
  });

  // ─── 3. Instantiate Repositories ───
  // TODO (Task 7): Replace with Prisma implementations
  // For now, the use cases accept interfaces — we'll wire
  // the real repositories when we implement the DB layer.

  // ─── 4. Instantiate Use Cases ───
  const generateOAuthUrlUseCase = new GenerateOAuthUrlUseCase(linkedInGateway);

  // NOTE: processOAuthCallbackUseCase requires repositories that
  // will be implemented in Task 7. For now, we register only the
  // routes that work without repositories.
  // const processOAuthCallbackUseCase = new ProcessOAuthCallbackUseCase(
  //   linkedInGateway, cryptoService, userRepository, oauthCredentialRepository,
  // );

  // ─── 5. Instantiate Controllers ───
  // Temporarily passing null for processOAuthCallbackUseCase
  // The callback route will throw until Task 7 wires the repositories.
  const oauthController = new OAuthController(
    generateOAuthUrlUseCase,
    undefined as unknown as ProcessOAuthCallbackUseCase,
  );

  // ─── 6. Register Routes ───
  registerOAuthRoutes(app, oauthController);

  // ─── 7. Start the Server ───
  await app.listen({ port: PORT, host: HOST });

  // Suppress the unused variable warning — cryptoService will be
  // used when processOAuthCallbackUseCase is wired in Task 7.
  void cryptoService;

  app.log.info(`[LinkedBridge] 🚀 Server running on http://${HOST}:${PORT}`);
  app.log.info(`[LinkedBridge] 🔒 Helmet, Rate-Limit, and Cookie plugins active`);
}

bootstrap().catch((error: unknown) => {
  console.error('[LinkedBridge] Fatal error during bootstrap:', error);
  process.exit(1);
});
