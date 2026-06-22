import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicEventTypes } from 'src/api/guest';
import { Button } from 'src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';
import { Skeleton } from 'src/components/ui/skeleton';
import type { EventType } from 'src/types';

export function BookCatalogPage() {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPublicEventTypes()
      .then(setEventTypes)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-destructive">Не удалось загрузить типы встреч: {error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-heading mb-2 text-3xl font-bold">Доступные типы встреч</h1>
      <p className="mb-8 text-muted-foreground">Выберите тип встречи для бронирования.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-3 h-4 w-20" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))
          : eventTypes.map((et) => (
              <Card key={et.id}>
                <CardHeader>
                  <CardTitle>{et.title}</CardTitle>
                  <CardDescription>{et.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    <span>{et.durationMinutes} мин</span>
                  </div>
                  <Button className="w-full" render={<Link to={`/book/${et.id}`} />}>
                    Забронировать
                  </Button>
                </CardContent>
              </Card>
            ))}
        {!loading && eventTypes.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">Пока нет доступных типов встреч.</p>
        )}
      </div>
    </div>
  );
}
