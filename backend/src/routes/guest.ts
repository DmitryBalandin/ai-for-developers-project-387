import { differenceInDays, isBefore } from 'date-fns';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { BookingError, validateBookingCreation } from '../services/bookings.js';
import { generateSlots } from '../services/slots.js';
import { store } from '../store.js';

const bookingCreateSchema = z.object({
  eventTypeId: z.string().min(1),
  guestName: z.string().min(1, 'Guest name is required'),
  guestEmail: z.string().email().optional().or(z.literal('')),
  startTime: z.string().min(1, 'Start time is required'),
});

const slotsParamsSchema = z.object({
  eventTypeId: z.string().min(1),
});

const slotsQuerySchema = z.object({
  dateFrom: z.string().datetime({ message: 'Invalid date format. Use ISO 8601.' }),
  dateTo: z.string().datetime({ message: 'Invalid date format. Use ISO 8601.' }),
});

export function registerGuestRoutes(app: FastifyInstance): void {
  app.get('/api/public/event-types', async (_request, reply) => {
    return reply.send(store.listEventTypes());
  });

  app.get('/api/public/event-types/:eventTypeId/slots', async (request, reply) => {
    const parsedParams = slotsParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        code: 400,
        message: parsedParams.error.issues.map((i) => i.message).join('; '),
      });
    }
    const { eventTypeId } = parsedParams.data;

    const parsedQuery = slotsQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.status(400).send({
        code: 400,
        message: parsedQuery.error.issues.map((i) => i.message).join('; '),
      });
    }
    const { dateFrom, dateTo } = parsedQuery.data;

    const eventType = store.getEventType(eventTypeId);
    if (!eventType) {
      return reply.status(404).send({ code: 404, message: 'Event type not found' });
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    if (isBefore(to, from)) {
      return reply.status(400).send({
        code: 400,
        message: 'dateTo must be after dateFrom',
      });
    }

    if (differenceInDays(to, from) > 14) {
      return reply.status(400).send({
        code: 400,
        message: 'Date range must not exceed 14 days',
      });
    }

    const existingBookings = store.getBookingsByEventType(eventTypeId);
    const slots = generateSlots(eventType, from, to, existingBookings);
    return reply.send(slots);
  });

  app.post('/api/bookings', async (request, reply) => {
    const parsed = bookingCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        code: 400,
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }

    const { eventTypeId, guestName, guestEmail, startTime } = parsed.data;

    const eventType = store.getEventType(eventTypeId);
    if (!eventType) {
      return reply.status(404).send({ code: 404, message: 'Event type not found' });
    }

    try {
      const existing = store.getBookingsByEventType(eventTypeId);
      const { endDate } = validateBookingCreation(eventType, startTime, existing);

      const booking = store.createBooking(
        { eventTypeId, guestName, guestEmail: guestEmail || undefined, startTime },
        endDate.toISOString(),
      );
      return reply.status(201).send(booking);
    } catch (error) {
      if (error instanceof BookingError) {
        return reply.status(error.statusCode).send({
          code: error.statusCode,
          message: error.message,
        });
      }
      throw error;
    }
  });
}
