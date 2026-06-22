import { addMinutes, isBefore } from 'date-fns';
import type { Booking, EventType } from '../types.js';
import { isSlotAvailable } from './slots.js';

export class BookingError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'BookingError';
    this.statusCode = statusCode;
  }
}

export function computeEndTime(startTime: Date, durationMinutes: number): Date {
  return addMinutes(startTime, durationMinutes);
}

export function validateBookingCreation(
  eventType: EventType,
  startTime: string,
  existingBookings: Booking[],
): { startDate: Date; endDate: Date } {
  const startDate = new Date(startTime);

  if (Number.isNaN(startDate.getTime())) {
    throw new BookingError('Invalid startTime format');
  }

  if (isBefore(startDate, new Date())) {
    throw new BookingError('Cannot book in the past');
  }

  const endDate = computeEndTime(startDate, eventType.durationMinutes);

  if (!isSlotAvailable(startDate, endDate, existingBookings)) {
    throw new BookingError('This time slot is already booked', 409);
  }

  return { startDate, endDate };
}
