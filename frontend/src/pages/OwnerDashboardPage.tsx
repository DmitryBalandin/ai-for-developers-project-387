import { format } from 'date-fns';
import { Clock, Edit3, Loader2, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createEventType,
  deleteEventType,
  type EventTypeCreate,
  type EventTypeUpdate,
  listEventTypes,
  listUpcomingBookings,
  updateEventType,
} from 'src/api/owner';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Separator } from 'src/components/ui/separator';
import type { Booking, EventType } from 'src/types';

export function OwnerDashboardPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<EventType | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    listEventTypes()
      .then(setEventTypes)
      .catch(() => {});
    listUpcomingBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(data: EventTypeCreate) {
    await createEventType(data);
    setShowCreateDialog(false);
    const types = await listEventTypes();
    setEventTypes(types);
  }

  async function handleUpdate(id: string, data: EventTypeUpdate) {
    await updateEventType(id, data);
    setEditingType(null);
    const types = await listEventTypes();
    setEventTypes(types);
  }

  async function handleDelete(id: string) {
    await deleteEventType(id);
    const types = await listEventTypes();
    setEventTypes(types);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-heading mb-8 text-3xl font-bold">Панель управления</h1>

      <div className="mb-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading flex items-center gap-2 text-xl font-semibold">
            <Clock className="size-5" />
            Типы событий
          </h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger
              render={
                <Button size="sm">
                  <Plus className="size-4" />
                  Создать
                </Button>
              }
            />
            <EventTypeForm onSubmit={handleCreate} />
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {eventTypes.map((et) => (
              <Card key={et.id} size="sm">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{et.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {et.durationMinutes} мин &middot; {et.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Dialog
                      open={editingType?.id === et.id}
                      onOpenChange={(open) => {
                        if (!open) setEditingType(null);
                      }}
                    >
                      <DialogTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" onClick={() => setEditingType(et)}>
                            <Edit3 className="size-4" />
                          </Button>
                        }
                      />
                      {editingType?.id === et.id && (
                        <EventTypeForm initial={editingType} onSubmit={(data) => handleUpdate(et.id, data)} />
                      )}
                    </Dialog>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(et.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {eventTypes.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Пока нет типов событий. Создайте!</p>
            )}
          </div>
        )}
      </div>

      <Separator className="mb-8" />

      <div className="space-y-4">
        <h2 className="font-heading flex items-center gap-2 text-xl font-semibold">
          <Users className="size-5" />
          Предстоящие брони
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Card key={b.id} size="sm">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{b.guestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(b.startTime), 'MMM d, yyyy HH:mm')}
                      {' — '}
                      {format(new Date(b.endTime), 'HH:mm')}
                      {b.guestEmail ? ` \u00B7 ${b.guestEmail}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {b.status}
                  </span>
                </CardContent>
              </Card>
            ))}
            {bookings.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">Нет предстоящих броней.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EventTypeForm({
  initial,
  onSubmit,
}: {
  initial?: EventType;
  onSubmit: (data: EventTypeCreate) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [duration, setDuration] = useState(String(initial?.durationMinutes ?? 30));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        durationMinutes: Number(duration),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogContent showCloseButton={!submitting}>
      <DialogHeader>
        <DialogTitle>{initial ? 'Редактировать тип события' : 'Создать тип события'}</DialogTitle>
        <DialogDescription>
          {initial ? 'Обновите детали типа события.' : 'Добавьте новый тип события для бронирования гостями.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="et-title">Название</Label>
          <Input id="et-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="et-desc">Описание</Label>
          <Input id="et-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="et-dur">Длительность (минуты)</Label>
          <Input
            id="et-dur"
            type="number"
            min={5}
            step={5}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" disabled={submitting} />}>Отмена</DialogClose>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            {initial ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
