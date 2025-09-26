import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CalendarView, CalendarViewRef } from "@/components/calendar/calendar-view";
import { EventForm } from "@/components/calendar/event-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCalendar } from "@/hooks/use-calendar";
import { usePermissions } from "@/hooks/use-permissions";

const Calendar = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = useRef<CalendarViewRef>(null);

  const { events, loading } = useCalendar();
  const { hasPermission } = usePermissions();

  const canCreateEvents = hasPermission('calendar', 'create');

  const handleEventCreated = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
    setSelectedDate(null);
    calendarRef.current?.resetViewState();
  };

  const handleEditEvent = (eventId: string) => {
    setEditingEvent(eventId);
    setIsFormOpen(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Calendário</h1>
            {canCreateEvents && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingEvent(null);
                    setSelectedDate(null);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                    </DialogTitle>
                  </DialogHeader>
                  <EventForm 
                    eventId={editingEvent}
                    selectedDate={selectedDate}
                    onSuccess={handleEventCreated}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <p className="text-muted-foreground">
            Gerencie reuniões, atendimentos e eventos da organização
          </p>
        </div>

        {/* Calendário */}
          <CalendarView
            ref={calendarRef}
            events={events}
            loading={loading}
            onEditEvent={handleEditEvent}
            onDateSelect={handleDateSelect}
          />
      </div>
    </MainLayout>
  );
};

export default Calendar;