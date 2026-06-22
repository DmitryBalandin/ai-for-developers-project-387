import { addMinutes, isBefore } from 'date-fns';
import type { AvailableSlot, Booking, EventType } from '../types.js';

export function isSlotAvailable(startTime: Date, endTime: Date, existingBookings: Booking[]): boolean {
  return !existingBookings.some(
    (b) =>
      b.status === 'confirmed' && isBefore(new Date(b.startTime), endTime) && isBefore(startTime, new Date(b.endTime)),
  );
}

export function generateSlots(
  eventType: EventType,
  dateFrom: Date,
  dateTo: Date,
  existingBookings: Booking[],
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  let current = new Date(dateFrom);

  while (isBefore(current, dateTo)) {
    const slotEnd = addMinutes(current, eventType.durationMinutes);
    if (isBefore(dateTo, slotEnd)) break;

    if (isSlotAvailable(current, slotEnd, existingBookings)) {
      slots.push({
        startTime: current.toISOString(),
        endTime: slotEnd.toISOString(),
      });
    }

    current = slotEnd;
  }

  return slots;
}
