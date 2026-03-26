import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'default' | 'sm';
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  [key: string]: any;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'default',
  onClick,
  className = '',
  style = {},
  disabled = false,
  ...props 
}: ButtonProps) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' :
    variant === 'tertiary' ? 'btn-tertiary' : 'btn-secondary';
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  
  return (
    <button 
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
      style={style}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
