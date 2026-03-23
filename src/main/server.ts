import 'dotenv/config';

const PORT = Number(process.env['PORT']) ?? 3333;

async function bootstrap(): Promise<void> {
  // Fastify server will be configured here in Task 2.
  console.log(`[LinkedBridge] Ready to start on port ${PORT}`);
}

bootstrap().catch((error: unknown) => {
  console.error('[LinkedBridge] Fatal error during bootstrap:', error);
  process.exit(1);
});
