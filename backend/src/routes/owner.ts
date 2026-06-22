import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { store } from '../store.js';

const eventTypeCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute'),
});

const eventTypeUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  durationMinutes: z.number().int().min(1).optional(),
});

const eventTypeIdParamSchema = z.object({
  id: z.string().min(1, 'Event type ID is required'),
});

export function registerOwnerRoutes(app: FastifyInstance): void {
  app.post('/api/event-types', async (request, reply) => {
    const parsed = eventTypeCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 400,
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    const eventType = store.createEventType(parsed.data);
    return reply.status(201).send(eventType);
  });

  app.get('/api/event-types', async (_request, reply) => {
    return reply.send(store.listEventTypes());
  });

  app.get('/api/event-types/:id', async (request, reply) => {
    const parsed = eventTypeIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 400,
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    const { id } = parsed.data;
    const eventType = store.getEventType(id);
    if (!eventType) {
      return reply.status(404).send({ code: 404, message: 'Event type not found' });
    }
    return reply.send(eventType);
  });

  app.put('/api/event-types/:id', async (request, reply) => {
    const parsedParams = eventTypeIdParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        code: 400,
        message: parsedParams.error.issues.map((i) => i.message).join('; '),
      });
    }
    const { id } = parsedParams.data;

    const parsedBody = eventTypeUpdateSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({
        code: 400,
        message: parsedBody.error.issues.map((i) => i.message).join('; '),
      });
    }
    const updated = store.updateEventType(id, parsedBody.data);
    if (!updated) {
      return reply.status(404).send({ code: 404, message: 'Event type not found' });
    }
    return reply.send(updated);
  });

  app.delete('/api/event-types/:id', async (request, reply) => {
    const parsed = eventTypeIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 400,
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    const { id } = parsed.data;
    const deleted = store.deleteEventType(id);
    if (!deleted) {
      return reply.status(404).send({ code: 404, message: 'Event type not found' });
    }
    return reply.status(204).send();
  });

  app.get('/api/bookings', async (_request, reply) => {
    return reply.send(store.listUpcomingBookings());
  });
}
