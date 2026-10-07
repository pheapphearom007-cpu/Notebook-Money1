import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer font-khmer';

  const variants = {
    primary:
      'bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground shadow-xs focus:ring-ring border border-primary',
    secondary:
      'bg-secondary hover:bg-[var(--secondary-hover)] text-secondary-foreground shadow-xs focus:ring-ring border border-border',
    outline:
      'border border-border text-foreground bg-card hover:bg-muted focus:ring-ring',
    danger:
      'bg-destructive hover:opacity-90 text-destructive-foreground border border-destructive shadow-xs focus:ring-destructive',
    ghost:
      'bg-transparent hover:bg-muted text-foreground focus:ring-ring',
  };

  const sizes = {
    sm: 'text-xs px-3.5 py-1.5 min-h-[36px] sm:min-h-0 gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[42px] sm:min-h-0 gap-2',
    lg: 'text-base px-5 py-2.5 min-h-[48px] sm:min-h-0 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
