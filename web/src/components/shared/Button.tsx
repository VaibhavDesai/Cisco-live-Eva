import React from 'react';

interface ButtonProps {
  /** Button label or icon content */
  children: React.ReactNode;
  /** Visual emphasis: primary, secondary, or tertiary */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Semantic color: default, negative (danger/alert), positive, or accent */
  color?: 'default' | 'negative' | 'positive' | 'accent';
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
  color = 'default',
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
  const colorClass = color !== 'default' ? `btn-${color}` : '';
  const sizeClass = size === 'sm' ? 'btn-sm' : '';
  
  return (
    <button 
      className={`btn ${variantClass} ${colorClass} ${sizeClass} ${className}`.replace(/\s+/g, ' ').trim()}
      onClick={onClick}
      style={style}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
