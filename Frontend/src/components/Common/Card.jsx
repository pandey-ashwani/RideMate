import React from 'react';

export const Card = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-slate-100 shadow-xs p-5 transition-all duration-300
        ${hoverable ? 'hover:shadow-md hover:border-slate-200/80 hover:-translate-y-0.5' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
