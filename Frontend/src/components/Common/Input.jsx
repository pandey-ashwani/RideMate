import React from 'react';

export const Input = ({
  label,
  type = 'text',
  placeholder = '',
  name,
  value,
  onChange,
  error,
  required = false,
  className = '',
  icon: Icon,
  ...props
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-slate-700 select-none">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`
            w-full rounded-lg border text-sm transition-all duration-200 py-3 pr-4
            ${Icon ? 'pl-11' : 'pl-4'}
            ${error 
              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10' 
              : 'border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white'
            }
            text-slate-800 placeholder-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400
          `}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
};

export default Input;
