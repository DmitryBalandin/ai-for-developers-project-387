import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service(#{title: "Calendar of Calls API"})
@server("http://localhost:3000", "Development server")
namespace CalendarOfCalls;

// ─── Domain Models ────────────────────────────────────────────

model EventType {
  id: string;
  title: string;
  description: string;
  durationMinutes: int32;
}

model Booking {
  id: string;
  eventTypeId: string;
  guestName: string;
  guestEmail?: string;
  startTime: utcDateTime;
  endTime: utcDateTime;
  status: BookingStatus;
  createdAt: utcDateTime;
}

model AvailableSlot {
  startTime: utcDateTime;
  endTime: utcDateTime;
}

model EventTypeCreate {
  title: string;
  description: string;
  durationMinutes: int32;
}

model EventTypeUpdate {
  title?: string;
  description?: string;
  durationMinutes?: int32;
}

model BookingCreate {
  eventTypeId: string;
  guestName: string;
  guestEmail?: string;
  startTime: utcDateTime;
}

enum BookingStatus {
  confirmed,
  cancelled,
}

// ─── Error Models ─────────────────────────────────────────────

@error
model NotFoundError {
  code: 404;
  message: string;
}

@error
model ConflictError {
  code: 409;
  message: string;
}

@error
model ValidationError {
  code: 400;
  message: string;
}

// ─── Owner: Event Type Management ─────────────────────────────

@route("/api/event-types")
interface EventTypesOwner {
  @doc("Create a new event type. Duration is specified in minutes.")
  @post
  createEventType(@body body: EventTypeCreate): {
    @statusCode _: 201;
    @body body: EventType;
  };

  @doc("List all event types with full details.")
  @get
  listEventTypes(): EventType[];

  @doc("Get a single event type by ID.")
  @get
  @route("{id}")
  getEventType(id: string): EventType | NotFoundError;

  @doc("Update an existing event type. All fields are optional.")
  @put
  @route("{id}")
  updateEventType(id: string, @body body: EventTypeUpdate): EventType | NotFoundError;

  @doc("Delete an event type by ID.")
  @delete
  @route("{id}")
  deleteEventType(id: string): {
    @statusCode _: 204;
  } | NotFoundError;
}

// ─── Owner: View Bookings ─────────────────────────────────────

@route("/api/bookings")
interface BookingsOwner {
  @doc("List all upcoming bookings across all event types. Owner-only.")
  @get
  listUpcomingBookings(): Booking[];
}

// ─── Guest: Browse Event Types & Slots ────────────────────────

@route("/api/public/event-types")
interface EventTypesGuest {
  @doc("List available event types (public). Returns title, description, and duration.")
  @get
  listPublicEventTypes(): EventType[];

  @doc("Get available time slots for a given event type. The date range must not exceed 14 days. Server checks that slots do not overlap with existing bookings.")
  @get
  @route("{eventTypeId}/slots")
  getAvailableSlots(
    eventTypeId: string,
    @query dateFrom: utcDateTime,
    @query dateTo: utcDateTime,
  ): AvailableSlot[] | NotFoundError | ValidationError;
}

// ─── Guest: Create Booking ────────────────────────────────────

@route("/api/bookings")
interface BookingsGuest {
  @doc("Create a new booking. The server validates: (1) slot is not already booked, (2) startTime falls within the 14-day window, (3) endTime = startTime + eventType.durationMinutes. Returns 409 if slot is occupied.")
  @post
  createBooking(@body body: BookingCreate): {
    @statusCode _: 201;
    @body body: Booking;
  } | ValidationError | ConflictError;
}
