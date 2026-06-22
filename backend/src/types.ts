export interface EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
}

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

export interface Booking {
  id: string;
  eventTypeId: string;
  guestName: string;
  guestEmail?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  createdAt: string;
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface BookingCreate {
  eventTypeId: string;
  guestName: string;
  guestEmail?: string;
  startTime: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
}

export interface ApiError {
  code: number;
  message: string;
}
