import { Button, ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PermissionLinkProps extends ButtonProps {
  hasPermission: boolean;
  permissionMessage?: string;
  children: React.ReactNode;
}

export function PermissionLink({ 
  hasPermission, 
  permissionMessage = "Você não tem permissão para esta ação",
  children,
  className,
  onClick,
  ...props 
}: PermissionLinkProps) {
  if (!hasPermission) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            <Button
              {...props}
              variant="ghost"
              size="sm"
              disabled={true}
              className={cn("opacity-50 cursor-not-allowed", className)}
              onClick={undefined}
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
    <Button 
      {...props} 
      variant="ghost"
      size="sm"
      className={className}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}