import { cn } from "@/lib/utils";
import logoImage from "@/assets/bsamlogo.jpg";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({
  className,
  showText = true
}: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <img 
          src={logoImage} 
          alt="O Bom Samaritano Logo" 
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>
      {showText && (
        <span className="font-semibold text-foreground">O Bom Samaritano</span>
      )}
    </div>
  );
};