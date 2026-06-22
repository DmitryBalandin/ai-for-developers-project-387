import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { registerGuestRoutes } from './routes/guest.js';
import { registerOwnerRoutes } from './routes/owner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],
  });

  registerOwnerRoutes(app);
  registerGuestRoutes(app);

  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  await app.register(fastifyStatic, {
    root: frontendDist,
    prefix: '/',
  });

  app.setNotFoundHandler((_request, reply) => {
    reply.sendFile('index.html');
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    const err = error as Error & { statusCode?: number };
    const statusCode = err.statusCode ?? 500;
    reply.status(statusCode).send({
      code: statusCode,
      message: err.message ?? 'Internal server error',
    });
  });

  return app;
}
