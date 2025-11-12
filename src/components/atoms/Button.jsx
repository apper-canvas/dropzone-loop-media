import { forwardRef } from "react";
import { cn } from "@/utils/cn";
import ApperIcon from "@/components/ApperIcon";

const Button = forwardRef(({ 
  className, 
  variant = "primary", 
  size = "default", 
  children, 
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary to-accent text-white shadow-md hover:shadow-lg hover:scale-105 focus:ring-primary/50",
    secondary: "bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:shadow-md hover:scale-105 focus:ring-primary/50",
    outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:scale-105 focus:ring-primary/50",
    ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:scale-105 focus:ring-gray-500/50",
    danger: "bg-gradient-to-r from-error to-pink-500 text-white shadow-md hover:shadow-lg hover:scale-105 focus:ring-error/50"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    default: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl"
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <ApperIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
      )}
      {leftIcon && !loading && (
        <ApperIcon name={leftIcon} className="w-4 h-4 mr-2" />
      )}
      {children}
      {rightIcon && !loading && (
        <ApperIcon name={rightIcon} className="w-4 h-4 ml-2" />
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button;