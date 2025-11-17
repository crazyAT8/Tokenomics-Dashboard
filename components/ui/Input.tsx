import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'search';
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  icon,
  className,
  ...props
}) => {
  const baseClasses = 'flex h-11 sm:h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base sm:text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] sm:min-h-[40px]';
  
  const variants = {
    default: baseClasses,
    search: `${baseClasses} pl-10`,
  };

  if (variant === 'search' && icon) {
    return (
      <div className="relative">
        <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input
          className={clsx(variants[variant], className)}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={clsx(variants[variant], className)}
      {...props}
    />
  );
};
