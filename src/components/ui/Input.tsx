import * as React from 'react';
import { cn } from '@/utils';
import { Search, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, showPasswordToggle, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-dark-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full px-4 py-2.5 rounded-[6px] border border-dark-200 bg-white text-dark-800 placeholder:text-dark-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200',
              icon && 'pl-10',
              showPasswordToggle && 'pr-10',
              error && 'border-danger-500 focus:ring-danger-500',
              className
            )}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SearchInputProps extends Omit<InputProps, 'icon'> {
  onSearch?: (value: string) => void;
  debounce?: number;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onChange, onSearch, debounce = 300, ...props }, ref) => {
    const [value, setValue] = React.useState('');
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange?.(e);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (onSearch) {
        timeoutRef.current = setTimeout(() => {
          onSearch(newValue);
        }, debounce);
      }
    };

    return (
      <Input
        ref={ref}
        className={cn('bg-dark-50 border-dark-100', className)}
        icon={<Search className="w-4 h-4" />}
        placeholder="搜索资产名称、编号..."
        value={value}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { Input, SearchInput };
