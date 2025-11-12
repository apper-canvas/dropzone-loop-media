import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const ProgressBar = forwardRef(({ 
  className,
  value = 0,
  variant = "default",
  size = "default",
  animated = false,
  showLabel = false,
  label,
  ...props 
}, ref) => {
  const baseClasses = "relative w-full bg-gray-200 overflow-hidden";
  const fillClasses = "h-full transition-all duration-300 ease-out";
  
  const variants = {
    default: "bg-gradient-to-r from-primary to-accent",
    success: "bg-gradient-to-r from-success to-green-400",
    warning: "bg-gradient-to-r from-warning to-yellow-400",
    error: "bg-gradient-to-r from-error to-red-400",
    info: "bg-gradient-to-r from-info to-blue-400"
  };
  
  const sizes = {
    sm: "h-1.5 rounded-full",
    default: "h-2 rounded-full",
    lg: "h-3 rounded-lg"
  };

  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs text-secondary">
          <span>{label || "Progress"}</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      
      <div
        className={cn(
          baseClasses,
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        <div
          className={cn(
            fillClasses,
            variants[variant],
            animated && "progress-striped"
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
});

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;