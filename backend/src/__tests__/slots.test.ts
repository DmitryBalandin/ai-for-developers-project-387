import { describe, expect, it } from 'vitest';
import { generateSlots, isSlotAvailable } from '../services/slots.js';
import type { AvailableSlot, Booking, EventType } from '../types.js';

const eventType: EventType = {
  id: 'et-1',
  title: 'Test',
  description: 'Test event type',
  durationMinutes: 30,
};

function slotsToTimestamps(slots: AvailableSlot[]): string[] {
  return slots.map((s) => `${formatTime(s.startTime)}-${formatTime(s.endTime)}`);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
}

function makeBooking(startTime: Date, endTime: Date, status: Booking['status'] = 'confirmed'): Booking {
  return {
    id: 'b-1',
    eventTypeId: 'et-1',
    guestName: 'Test',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    status,
    createdAt: new Date().toISOString(),
  };
}

describe('isSlotAvailable', () => {
  it('returns true when there are no bookings', () => {
    const start = new Date('2026-06-10T09:00:00Z');
    const end = new Date('2026-06-10T09:30:00Z');
    expect(isSlotAvailable(start, end, [])).toBe(true);
  });

  it('returns false when slot is fully occupied', () => {
    const start = new Date('2026-06-10T09:00:00Z');
    const end = new Date('2026-06-10T09:30:00Z');
    const bookings = [makeBooking(start, end)];
    expect(isSlotAvailable(start, end, bookings)).toBe(false);
  });

  it('returns true when slot is occupied by a cancelled booking', () => {
    const start = new Date('2026-06-10T09:00:00Z');
    const end = new Date('2026-06-10T09:30:00Z');
    const bookings = [makeBooking(start, end, 'cancelled')];
    expect(isSlotAvailable(start, end, bookings)).toBe(true);
  });

  it('returns true for adjacent slots (no overlap)', () => {
    const existingStart = new Date('2026-06-10T09:00:00Z');
    const existingEnd = new Date('2026-06-10T09:30:00Z');
    const targetStart = new Date('2026-06-10T09:30:00Z');
    const targetEnd = new Date('2026-06-10T10:00:00Z');
    const bookings = [makeBooking(existingStart, existingEnd)];
    expect(isSlotAvailable(targetStart, targetEnd, bookings)).toBe(true);
  });

  it('returns false for partial overlap at the start', () => {
    const existingStart = new Date('2026-06-10T09:00:00Z');
    const existingEnd = new Date('2026-06-10T10:00:00Z');
    const targetStart = new Date('2026-06-10T09:30:00Z');
    const targetEnd = new Date('2026-06-10T10:30:00Z');
    const bookings = [makeBooking(existingStart, existingEnd)];
    expect(isSlotAvailable(targetStart, targetEnd, bookings)).toBe(false);
  });

  it('returns false for partial overlap at the end', () => {
    const existingStart = new Date('2026-06-10T09:30:00Z');
    const existingEnd = new Date('2026-06-10T10:30:00Z');
    const targetStart = new Date('2026-06-10T09:00:00Z');
    const targetEnd = new Date('2026-06-10T10:00:00Z');
    const bookings = [makeBooking(existingStart, existingEnd)];
    expect(isSlotAvailable(targetStart, targetEnd, bookings)).toBe(false);
  });

  it('returns false when booking fully contains an existing booking', () => {
    const existingStart = new Date('2026-06-10T09:15:00Z');
    const existingEnd = new Date('2026-06-10T09:45:00Z');
    const targetStart = new Date('2026-06-10T09:00:00Z');
    const targetEnd = new Date('2026-06-10T10:00:00Z');
    const bookings = [makeBooking(existingStart, existingEnd)];
    expect(isSlotAvailable(targetStart, targetEnd, bookings)).toBe(false);
  });
});

describe('generateSlots', () => {
  it('generates 4 slots for a 30-min type over 2 hours', () => {
    const dateFrom = new Date('2026-06-10T09:00:00Z');
    const dateTo = new Date('2026-06-10T11:00:00Z');

    const slots = generateSlots(eventType, dateFrom, dateTo, []);

    expect(slots).toHaveLength(4);
    expect(slotsToTimestamps(slots)).toEqual(['09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00']);
  });

  it('excludes an occupied slot', () => {
    const dateFrom = new Date('2026-06-10T09:00:00Z');
    const dateTo = new Date('2026-06-10T11:00:00Z');

    const existingBooking: Booking = {
      id: 'b-1',
      eventTypeId: 'et-1',
      guestName: 'Occupied',
      startTime: new Date('2026-06-10T09:00:00Z').toISOString(),
      endTime: new Date('2026-06-10T09:30:00Z').toISOString(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const slots = generateSlots(eventType, dateFrom, dateTo, [existingBooking]);

    expect(slots).toHaveLength(3);
    expect(slotsToTimestamps(slots)).toEqual(['09:30-10:00', '10:00-10:30', '10:30-11:00']);
  });

  it('generates slots even when time is in the past', () => {
    const dateFrom = new Date('2020-01-01T09:00:00Z');
    const dateTo = new Date('2020-01-01T10:00:00Z');

    const slots = generateSlots(eventType, dateFrom, dateTo, []);

    expect(slots).toHaveLength(2);
    expect(slotsToTimestamps(slots)).toEqual(['09:00-09:30', '09:30-10:00']);
  });
});
