import { addDays } from 'date-fns';
import type { FastifyInstance } from 'fastify';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { store } from '../store.js';

describe('POST /api/bookings — 409 Conflict', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    store.reset();
    app = await buildApp();
  });

  it('returns 409 when booking an already occupied slot', async () => {
    const etRes = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { title: 'Test', description: 'Test', durationMinutes: 30 },
    });
    const eventType = etRes.json();

    const futureDate = addDays(new Date(), 1);
    futureDate.setHours(10, 0, 0, 0);
    const startTime = futureDate.toISOString();

    const firstRes = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { eventTypeId: eventType.id, guestName: 'Alice', startTime },
    });
    expect(firstRes.statusCode).toBe(201);

    const secondRes = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { eventTypeId: eventType.id, guestName: 'Bob', startTime },
    });
    expect(secondRes.statusCode).toBe(409);
    expect(secondRes.json()).toMatchObject({
      code: 409,
      message: expect.stringMatching(/already booked/i),
    });
  });
});

describe('POST /api/bookings — 400 past time', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    store.reset();
    app = await buildApp();
  });

  it('returns 400 when booking a time in the past', async () => {
    const etRes = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { title: 'Test', description: 'Test', durationMinutes: 30 },
    });
    const eventType = etRes.json();

    const pastDate = new Date('2020-01-01T10:00:00Z');
    const startTime = pastDate.toISOString();

    const res = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { eventTypeId: eventType.id, guestName: 'Alice', startTime },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      code: 400,
      message: expect.stringMatching(/past/i),
    });
  });
});

describe('DELETE /api/event-types — 404', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    store.reset();
    app = await buildApp();
  });

  it('returns 404 when deleting a non-existent event type', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/event-types/nonexistent-id',
    });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({
      code: 404,
      message: expect.stringMatching(/not found/i),
    });
  });
});

describe('GET /api/public/event-types/:id/slots — 400 >14 days', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    store.reset();
    app = await buildApp();
  });

  it('returns 400 when date range exceeds 14 days', async () => {
    const etRes = await app.inject({
      method: 'POST',
      url: '/api/event-types',
      payload: { title: 'Test', description: 'Test', durationMinutes: 30 },
    });
    const eventType = etRes.json();

    const dateFrom = '2026-06-01T00:00:00Z';
    const dateTo = '2026-06-20T00:00:00Z';

    const res = await app.inject({
      method: 'GET',
      url: `/api/public/event-types/${eventType.id}/slots?dateFrom=${dateFrom}&dateTo=${dateTo}`,
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      code: 400,
      message: expect.stringMatching(/14 days/i),
    });
  });
});
