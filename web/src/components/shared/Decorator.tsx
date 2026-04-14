import { type HTMLAttributes } from 'react';

export type DividerVariant = 'solid' | 'gradient';
export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Visual style of the rule (solid or gradient). */
  variant?: DividerVariant;
  /** Whether the divider runs horizontally or vertically. */
  orientation?: DividerOrientation;
}

/**
 * Horizontal or vertical divider rule (Figma `46-2318`) with solid or gradient styling.
 *
 * @example
 * <Divider variant="gradient" orientation="vertical" aria-hidden />
 */
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
  /** Visual scale of the decorative bullet. */
  size?: BulletSize;
}

/**
 * Decorative list or inline bullet sized to design tokens.
 *
 * @example
 * <Bullet size="small" />
 */
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
  /** Fill style of the marker bar (solid or striped). */
  variant?: MarkerVariant;
  /** Marker height in px; Figma default 60. */
  height?: number;
}

/**
 * Solid or striped marker bar with configurable height for emphasis or timelines.
 *
 * @example
 * <Marker variant="striped" height={48} />
 */
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
  /** Grabber alignment for horizontal vs vertical resize affordances. */
  orientation?: GrabberOrientation;
}

/**
 * Resize affordance styled as horizontal or vertical grabber divider atoms.
 *
 * @example
 * <GrabberDivider orientation="vertical" />
 */
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
  /** Centered text between the decorative divider segments. */
  label: string;
}

/**
 * Divider row that centers a label between decorative lines.
 *
 * @example
 * <DividerWithLabel label="Or continue with" />
 */
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
