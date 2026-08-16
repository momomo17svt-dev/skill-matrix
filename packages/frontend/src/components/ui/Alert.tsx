import React from 'react';
import { cn } from '../../lib/utils.js';

export const Alert: React.FC<{
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ variant = 'info', title, children, className }) => {
  const variants = {
    info: 'bg-indigo-50 border-indigo-200 text-indigo-800 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
    danger: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
  };

  return (
    <div className={cn('p-4 rounded-xl border text-sm', variants[variant], className)}>
      {title && <h5 className="font-semibold mb-1">{title}</h5>}
      <div>{children}</div>
    </div>
  );
};
