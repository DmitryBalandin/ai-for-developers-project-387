import { addDays } from 'date-fns';

const API_URL = 'http://localhost:3000';

export interface EventTypeSeed {
  title: string;
  description?: string;
  durationMinutes?: number;
}

export interface EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

export interface Booking {
  id: string;
  eventTypeId: string;
  guestName: string;
  guestEmail?: string;
  startTime: string;
  endTime: string;
  status: string;
}

export async function seedEventType(data: EventTypeSeed): Promise<EventType> {
  const res = await fetch(`${API_URL}/api/event-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to seed event type: ${res.status}`);
  return res.json();
}

export async function seedBooking(
  eventTypeId: string,
  data: { guestName: string; guestEmail?: string; startTime: string },
): Promise<Booking> {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventTypeId, ...data }),
  });
  if (!res.ok) throw new Error(`Failed to seed booking: ${res.status}`);
  return res.json();
}

export function getFutureDate(daysFromNow = 1): Date {
  return addDays(new Date(), daysFromNow);
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
