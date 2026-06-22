import type { AvailableSlot, Booking, BookingCreate, EventType } from 'src/types';
import { get, post } from './client';

export function getPublicEventTypes(): Promise<EventType[]> {
  return get<EventType[]>('/api/public/event-types');
}

export function getAvailableSlots(eventTypeId: string, dateFrom: string, dateTo: string): Promise<AvailableSlot[]> {
  const params = new URLSearchParams({ dateFrom, dateTo });
  return get<AvailableSlot[]>(`/api/public/event-types/${eventTypeId}/slots?${params}`);
}

export function createBooking(data: BookingCreate): Promise<Booking> {
  return post<Booking>('/api/bookings', data);
}
