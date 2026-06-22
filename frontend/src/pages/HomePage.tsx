import { Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImg from 'src/assets/hero.png';
import { Button } from 'src/components/ui/button';

export function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="space-y-6">
          <h1 className="font-heading text-4xl leading-tight font-bold tracking-tight md:text-5xl">
            Планируйте звонки с лёгкостью
          </h1>
          <p className="text-lg text-muted-foreground">
            Пусть гости бронируют время с вами мгновенно. Никаких писем туда-сюда. Просто выберите время — и готово.
          </p>
          <div className="flex gap-3">
            <Button size="lg" render={<Link to="/book" />}>
              Забронировать звонок
            </Button>
            <Button variant="outline" size="lg" render={<Link to="/owner" />}>
              Управление событиями
            </Button>
          </div>
          <div className="flex gap-8 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>Настройте доступное время</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" />
              <span>Гости бронируют мгновенно</span>
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <img src={heroImg} alt="Иллюстрация календаря" className="w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
