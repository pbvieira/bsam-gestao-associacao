import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  Check,
  X,
  AlertCircle,
  Calendar,
  CheckSquare,
  CalendarDays,
  CalendarCheck,
  CalendarX2,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const { notifications, markAsRead, markAllAsRead, respondToEventInvite, loading, unreadCount } = useNotifications();

  // Filtrar por não lidas se o filtro estiver ativo
  const filteredNotifications = showOnlyUnread 
    ? notifications.filter(n => !n.read)
    : notifications;

  const recentNotifications = filteredNotifications.slice(0, 5);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task":
        return <CheckSquare className="h-4 w-4 text-primary" />;
      case "event":
        return <Calendar className="h-4 w-4 text-accent" />;
      case "calendar_invite":
        return <CalendarDays className="h-4 w-4 text-blue-500" />;
      case "calendar_reminder":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "calendar_update":
        return <CalendarCheck className="h-4 w-4 text-amber-500" />;
      case "calendar_cancellation":
        return <CalendarX2 className="h-4 w-4 text-red-500" />;
      case "reminder":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "mention":
        return <AlertCircle className="h-4 w-4 text-purple-500" />;
      case "system":
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </h4>
          <div className="flex items-center gap-1">
            <Button
              variant={showOnlyUnread ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
              className="text-xs h-7 px-2"
              title={showOnlyUnread ? "Mostrar todas" : "Mostrar só não lidas"}
            >
              {showOnlyUnread ? "Não lidas" : "Todas"}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                Ler todas
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded" />
              ))}
            </div>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm">Nenhuma notificação</p>
            <p className="text-xs">Você está em dia!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-3 transition-colors hover:bg-muted/50 ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p
                      className={`text-sm leading-tight ${
                        !notification.read
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>

                    {/* Ações para convites de calendário */}
                    {notification.type === "calendar_invite" &&
                      notification.reference_id && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await respondToEventInvite(
                                notification.reference_id!,
                                "aceito"
                              );
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await respondToEventInvite(
                                notification.reference_id!,
                                "recusado"
                              );
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      )}
                  </div>

                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 h-6 w-6 p-0"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {notifications.length > 5 && (
          <div className="p-2 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Ver todas as notificações ({notifications.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
