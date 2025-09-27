import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PageLayoutProps {
  title: string;
  subtitle: string;
  actionButton?: ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
  statsCards?: ReactNode;
  children: ReactNode;
}

export function PageLayout({
  title,
  subtitle,
  actionButton,
  showBackButton = false,
  onBackClick,
  statsCards,
  children
}: PageLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {showBackButton && onBackClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {actionButton}
      </div>
      
      {/* Stats Cards */}
      {statsCards && (
        <div className="mb-6">
          {statsCards}
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  );
}