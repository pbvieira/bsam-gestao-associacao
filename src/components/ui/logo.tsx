import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-primary">
          <span className="text-lg font-bold text-primary-foreground">BS</span>
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-primary">Bom Samaritano</span>
          <span className="text-xs text-muted-foreground">Sistema de Gestão</span>
        </div>
      )}
    </div>
  );
};