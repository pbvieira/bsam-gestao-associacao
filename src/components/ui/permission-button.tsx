import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PermissionButtonProps extends ButtonProps {
  hasPermission: boolean;
  permissionMessage?: string;
  children: React.ReactNode;
}

export function PermissionButton({ 
  hasPermission, 
  permissionMessage = "Você não tem permissão para esta ação",
  children,
  className,
  ...props 
}: PermissionButtonProps) {
  if (!hasPermission) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            <Button
              {...props}
              disabled={true}
              className={cn("opacity-50 cursor-not-allowed", className)}
            >
              {children}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{permissionMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button {...props} className={className}>
      {children}
    </Button>
  );
}