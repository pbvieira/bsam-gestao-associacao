import { AppSidebar } from "@/components/navigation/sidebar";
import { NotificationPopover } from "@/components/navigation/notification-popover";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          {/* Header with Sidebar Trigger and Actions */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:flex" />
              <div className="flex-1" />
              
              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <NotificationPopover />
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}