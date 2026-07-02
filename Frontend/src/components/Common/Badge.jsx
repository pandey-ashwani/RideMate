import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // primary, secondary, success, danger, warning, info, neutral
  className = ''
}) => {
  const styles = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-accent/10 text-accent-dark border border-accent/30',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/50',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/50',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/50',
    neutral: 'bg-slate-50 text-slate-600 border border-slate-200/50'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
