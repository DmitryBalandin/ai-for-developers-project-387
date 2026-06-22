import { addDays, format, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Clock, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiErrorResponse } from 'src/api/client';
import { createBooking, getAvailableSlots, getPublicEventTypes } from 'src/api/guest';
import { Button } from 'src/components/ui/button';
import { Calendar } from 'src/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Separator } from 'src/components/ui/separator';
import type { AvailableSlot, EventType } from 'src/types';

export function BookEventPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();

  const [eventType, setEventType] = useState<EventType | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventTypeId) return;
    getPublicEventTypes()
      .then((types) => {
        const found = types.find((t) => t.id === eventTypeId);
        if (!found) throw new Error('Тип встречи не найден');
        setEventType(found);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventTypeId]);

  useEffect(() => {
    if (!eventTypeId || !selectedDate) return;
    const dateFrom = selectedDate.toISOString();
    const dateTo = addDays(selectedDate, 1).toISOString();
    getAvailableSlots(eventTypeId, dateFrom, dateTo)
      .then((newSlots) => {
        setSlots(newSlots);
        setSelectedSlot((prev) => (prev && newSlots.some((s) => s.startTime === prev.startTime) ? prev : null));
      })
      .catch(() => {
        setSlots([]);
        setSelectedSlot(null);
      });
  }, [eventTypeId, selectedDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventTypeId || !selectedSlot || !guestName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBooking({
        eventTypeId,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim() || undefined,
        startTime: selectedSlot.startTime,
      });
      setSuccessBooking(booking.id);
    } catch (err) {
      if (err instanceof ApiErrorResponse && err.status === 409) {
        setError('Этот слот только что заняли. Пожалуйста, выберите другой.');
        setSelectedSlot(null);
      } else {
        setError(err instanceof Error ? err.message : 'Не удалось создать бронь');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !eventType) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/book')}>
          Назад к типам встреч
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{eventType?.title}</CardTitle>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" />
                <span>{eventType?.durationMinutes} мин</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{eventType?.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center">
            <Calendar
              locale={ru}
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={{ before: startOfDay(new Date()) }}
              startMonth={startOfDay(new Date())}
              endMonth={addDays(new Date(), 14)}
            />
          </div>

          <Separator />

          {slots.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Доступное время</h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <Button
                    key={slot.startTime}
                    variant={selectedSlot?.startTime === slot.startTime ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {format(new Date(slot.startTime), 'HH:mm')}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">Нет доступных слотов на эту дату.</p>
          )}

          {selectedSlot && (
            <>
              <Separator />
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    placeholder="Ваше имя"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Эл. почта</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ваш@email.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting || !guestName.trim()}>
                  {submitting ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
                  Подтвердить бронь
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={!!successBooking}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessBooking(null);
            navigate('/book');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Бронь подтверждена!</DialogTitle>
            <DialogDescription>
              Ваша бронь создана. Номер подтверждения: <strong>{successBooking}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setSuccessBooking(null);
              navigate('/book');
            }}
          >
            Забронировать ещё
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
