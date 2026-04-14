import React from 'react';

interface ButtonProps {
  /** Button label or icon content */
  children: React.ReactNode;
  /** Visual emphasis: primary, secondary, or tertiary */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Control density */
  size?: 'default' | 'sm';
  /** Click handler for the button */
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Disables interaction and applies disabled styling */
  disabled?: boolean;
  /** Extra props forwarded to the native `<button>` */
  [key: string]: any;
}

/**
 * Momentum-styled `<button>` with primary / secondary / tertiary variants.
 * @example
 * <Button variant="primary" onClick={() => {}}>Save</Button>
 */
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
