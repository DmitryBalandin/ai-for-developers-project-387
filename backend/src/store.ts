import { nanoid } from 'nanoid';
import type { Booking, BookingCreate, EventType, EventTypeCreate, EventTypeUpdate } from './types.js';

class Store {
  private eventTypes = new Map<string, EventType>();
  private bookings = new Map<string, Booking>();

  reset(): void {
    this.eventTypes.clear();
    this.bookings.clear();
  }

  createEventType(data: EventTypeCreate): EventType {
    const eventType: EventType = {
      id: nanoid(),
      title: data.title,
      description: data.description,
      durationMinutes: data.durationMinutes,
    };
    this.eventTypes.set(eventType.id, eventType);
    return eventType;
  }

  listEventTypes(): EventType[] {
    return Array.from(this.eventTypes.values());
  }

  getEventType(id: string): EventType | undefined {
    return this.eventTypes.get(id);
  }

  updateEventType(id: string, data: EventTypeUpdate): EventType | undefined {
    const existing = this.eventTypes.get(id);
    if (!existing) return undefined;
    const updated: EventType = {
      ...existing,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
    };
    this.eventTypes.set(id, updated);
    return updated;
  }

  deleteEventType(id: string): boolean {
    return this.eventTypes.delete(id);
  }

  createBooking(data: BookingCreate, endTime: string): Booking {
    const booking: Booking = {
      id: nanoid(),
      eventTypeId: data.eventTypeId,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      startTime: data.startTime,
      endTime,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  getBookingsByEventType(eventTypeId: string): Booking[] {
    return Array.from(this.bookings.values()).filter((b) => b.eventTypeId === eventTypeId);
  }

  listUpcomingBookings(): Booking[] {
    const now = new Date().toISOString();
    return Array.from(this.bookings.values())
      .filter((b) => b.status === 'confirmed' && b.startTime >= now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}

export const store = new Store();
