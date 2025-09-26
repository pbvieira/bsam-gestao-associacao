import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNotifications, NotificationSettings } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { Clock, Mail, Bell } from "lucide-react";

export function NotificationSettingsComponent() {
  const { getNotificationSettings, updateNotificationSettings } = useNotifications();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await getNotificationSettings();
      if (userSettings) {
        setSettings(userSettings);
      } else {
        // Configurações padrão
        setSettings({
          id: '',
          user_id: '',
          reminder_1h: true,
          reminder_15min: true,
          reminder_at_time: true,
          email_notifications: false,
          created_at: '',
          updated_at: ''
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      await updateNotificationSettings({
        reminder_1h: settings.reminder_1h,
        reminder_15min: settings.reminder_15min,
        reminder_at_time: settings.reminder_at_time,
        email_notifications: settings.email_notifications,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificação</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificação
        </CardTitle>
        <CardDescription>
          Defina como e quando você deseja receber lembretes de eventos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lembretes de Eventos */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Lembretes de Eventos
          </h4>
          
          <div className="space-y-3 pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-1h" className="text-sm">
                Lembrete 1 hora antes
              </Label>
              <Switch
                id="reminder-1h"
                checked={settings.reminder_1h}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, reminder_1h: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-15min" className="text-sm">
                Lembrete 15 minutos antes
              </Label>
              <Switch
                id="reminder-15min"
                checked={settings.reminder_15min}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, reminder_15min: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-at-time" className="text-sm">
                Lembrete no momento do evento
              </Label>
              <Switch
                id="reminder-at-time"
                checked={settings.reminder_at_time}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, reminder_at_time: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Notificações por Email */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Notificações por Email
          </h4>
          
          <div className="pl-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="text-sm">
                Receber notificações por email
              </Label>
              <Switch
                id="email-notifications"
                checked={settings.email_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, email_notifications: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="pt-4 border-t">
          <Button onClick={handleSave}>
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}