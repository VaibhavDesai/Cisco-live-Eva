import { type HTMLAttributes } from 'react';

export type DividerVariant = 'solid' | 'gradient';
export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  variant?: DividerVariant;
  orientation?: DividerOrientation;
}

/** Figma Horizontal / Vertical Divider (`46-2318`). */
export function Divider({
  variant = 'solid',
  orientation = 'horizontal',
  className = '',
  ...rest
}: DividerProps) {
  return (
    <hr
      className={`decorator-divider decorator-divider--${variant} decorator-divider--${orientation} ${className}`.trim()}
      {...rest}
    />
  );
}

export type BulletSize = 'small' | 'medium' | 'large';

export interface BulletProps extends HTMLAttributes<HTMLSpanElement> {
  size?: BulletSize;
}

export function Bullet({ size = 'medium', className = '', ...rest }: BulletProps) {
  return (
    <span
      className={`decorator-bullet decorator-bullet--${size} ${className}`.trim()}
      {...rest}
    />
  );
}

export type MarkerVariant = 'solid' | 'striped';

export interface MarkerProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: MarkerVariant;
  /** Height in px; Figma default 60 */
  height?: number;
}

export function Marker({
  variant = 'solid',
  height = 60,
  className = '',
  style,
  ...rest
}: MarkerProps) {
  return (
    <span
      className={`decorator-marker decorator-marker--${variant} ${className}`.trim()}
      style={{ height, ...style }}
      {...rest}
    />
  );
}

export type GrabberOrientation = 'horizontal' | 'vertical';

export interface GrabberDividerProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: GrabberOrientation;
}

/** Resize affordance — Horizontal / Vertical Grabber Divider atoms */
export function GrabberDivider({
  orientation = 'horizontal',
  className = '',
  ...rest
}: GrabberDividerProps) {
  return (
    <div
      role="separator"
      className={
        orientation === 'horizontal'
          ? `decorator-grabber-h ${className}`.trim()
          : `decorator-grabber-v ${className}`.trim()
      }
      {...rest}
    />
  );
}

export interface DividerWithLabelProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function DividerWithLabel({
  label,
  className = '',
  ...rest
}: DividerWithLabelProps) {
  return (
    <div className={`decorator-divider-label ${className}`.trim()} {...rest}>
      <span>{label}</span>
    </div>
  );
}
