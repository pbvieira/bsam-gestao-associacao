import { useState } from "react";
import { AppSidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/navigation/header";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          {/* Header with Sidebar Trigger */}
          <header className="bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:flex" />
              <div className="flex-1" />
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