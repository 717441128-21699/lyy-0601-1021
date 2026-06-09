import * as React from 'react';
import { cn } from '@/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, icon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 hover:shadow-card-hover hover:-translate-y-0.5',
      secondary: 'bg-dark-100 text-dark-700 hover:bg-dark-200 focus:ring-dark-400 hover:shadow-card-hover hover:-translate-y-0.5',
      success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500 hover:shadow-card-hover hover:-translate-y-0.5',
      danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 hover:shadow-card-hover hover:-translate-y-0.5',
      ghost: 'bg-transparent text-dark-600 hover:bg-dark-100 focus:ring-dark-300',
      outline: 'bg-transparent border border-dark-300 text-dark-700 hover:bg-dark-50 focus:ring-dark-400',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
