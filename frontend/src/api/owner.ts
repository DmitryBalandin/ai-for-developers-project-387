import type { Booking, EventType } from 'src/types';
import { del, get, post, put } from './client';

export interface EventTypeCreate {
  title: string;
  description: string;
  durationMinutes: number;
}

export interface EventTypeUpdate {
  title?: string;
  description?: string;
  durationMinutes?: number;
}

export function listEventTypes(): Promise<EventType[]> {
  return get<EventType[]>('/api/event-types');
}

export function getEventType(id: string): Promise<EventType> {
  return get<EventType>(`/api/event-types/${id}`);
}

export function createEventType(data: EventTypeCreate): Promise<EventType> {
  return post<EventType>('/api/event-types', data);
}

export function updateEventType(id: string, data: EventTypeUpdate): Promise<EventType> {
  return put<EventType>(`/api/event-types/${id}`, data);
}

export function deleteEventType(id: string): Promise<void> {
  return del<void>(`/api/event-types/${id}`);
}

export function listUpcomingBookings(): Promise<Booking[]> {
  return get<Booking[]>('/api/bookings');
}
