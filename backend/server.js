import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';

const start = async () => {
  await connectDb();

  const server = createApp().listen(env.port, () =>
    console.log(`[server] listening on http://localhost:${env.port}`)
  );

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((err) => {
  console.error('[server] failed to start:', err.message);
  process.exit(1);
});
