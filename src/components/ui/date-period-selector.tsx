import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isToday,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export type ViewPeriod = 'day' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DatePeriodSelectorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  viewPeriod: ViewPeriod;
  onViewPeriodChange: (period: ViewPeriod) => void;
  className?: string;
}

export function getDateRange(date: Date, period: ViewPeriod): DateRange {
  switch (period) {
    case 'day':
      return { start: date, end: date };
    case 'week':
      return { 
        start: startOfWeek(date, { locale: ptBR }), 
        end: endOfWeek(date, { locale: ptBR }) 
      };
    case 'month':
      return { 
        start: startOfMonth(date), 
        end: endOfMonth(date) 
      };
  }
}

export function formatPeriodLabel(date: Date, period: ViewPeriod): string {
  switch (period) {
    case 'day':
      return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    case 'week': {
      const start = startOfWeek(date, { locale: ptBR });
      const end = endOfWeek(date, { locale: ptBR });
      const sameMonth = start.getMonth() === end.getMonth();
      if (sameMonth) {
        return `${format(start, "dd", { locale: ptBR })} a ${format(end, "dd 'de' MMMM", { locale: ptBR })}`;
      }
      return `${format(start, "dd 'de' MMM", { locale: ptBR })} a ${format(end, "dd 'de' MMM", { locale: ptBR })}`;
    }
    case 'month':
      return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  }
}

export function DatePeriodSelector({
  date,
  onDateChange,
  viewPeriod,
  onViewPeriodChange,
  className,
}: DatePeriodSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePrevious = () => {
    switch (viewPeriod) {
      case 'day':
        onDateChange(subDays(date, 1));
        break;
      case 'week':
        onDateChange(subWeeks(date, 1));
        break;
      case 'month':
        onDateChange(subMonths(date, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewPeriod) {
      case 'day':
        onDateChange(addDays(date, 1));
        break;
      case 'week':
        onDateChange(addWeeks(date, 1));
        break;
      case 'month':
        onDateChange(addMonths(date, 1));
        break;
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isTodaySelected = viewPeriod === 'day' && isSameDay(date, new Date());

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {/* Period selector tabs */}
      <Tabs value={viewPeriod} onValueChange={(v) => onViewPeriodChange(v as ViewPeriod)}>
        <TabsList className="h-9">
          <TabsTrigger value="day" className="text-xs px-3">Dia</TabsTrigger>
          <TabsTrigger value="week" className="text-xs px-3">Semana</TabsTrigger>
          <TabsTrigger value="month" className="text-xs px-3">Mês</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Navigation arrows + Date picker */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handlePrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[200px] justify-start text-left font-normal h-9",
                isToday(date) && viewPeriod === 'day' && "border-primary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="capitalize">{formatPeriodLabel(date, viewPeriod)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  onDateChange(d);
                  setCalendarOpen(false);
                }
              }}
              locale={ptBR}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Today button */}
      {!isTodaySelected && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs"
          onClick={handleToday}
        >
          Hoje
        </Button>
      )}
    </div>
  );
}
