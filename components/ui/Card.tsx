import React from 'react';
import { clsx } from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800',
    outlined: 'bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800',
    elevated: 'bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800',
  };

  return (
    <div
      className={clsx(variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={clsx('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p
      className={clsx('text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('p-6 pt-0', className)}
      {...props}
    >
      {children}
    </div>
  );
};
