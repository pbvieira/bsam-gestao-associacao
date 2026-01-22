import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DateGroupHeaderProps {
  date: Date;
  itemCount?: number;
  pendingCount?: number;
  className?: string;
}

function getRelativeLabel(date: Date): string | null {
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isYesterday(date)) return 'Ontem';
  return null;
}

export function DateGroupHeader({
  date,
  itemCount,
  pendingCount,
  className,
}: DateGroupHeaderProps) {
  const relativeLabel = getRelativeLabel(date);
  const dateLabel = format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg mb-3 border-l-4",
        isToday(date) ? "border-l-primary" : "border-l-muted-foreground/30",
        className
      )}
    >
      <CalendarDays className={cn(
        "h-5 w-5",
        isToday(date) ? "text-primary" : "text-muted-foreground"
      )} />
      
      <div className="flex-1">
        <span className="font-medium capitalize">
          {relativeLabel && (
            <span className="text-primary mr-2">{relativeLabel} •</span>
          )}
          {dateLabel}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {typeof itemCount === 'number' && (
          <Badge variant="secondary">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'}
          </Badge>
        )}
        {typeof pendingCount === 'number' && pendingCount > 0 && (
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
    </div>
  );
}
