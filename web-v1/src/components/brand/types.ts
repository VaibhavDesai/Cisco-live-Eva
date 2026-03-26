/**
 * Brand logo variants — align naming with Brand Visuals Library (Figma 421-2344).
 * Use `onDark` / `onLight` for explicit canvas; `inherit` follows theme text / currentColor.
 */
export type BrandLogoTone = 'inherit' | 'onDark' | 'onLight';

export type BrandLogoProps = {
  /** Pixel height; width scales with aspect ratio unless `width` is set. */
  height?: number;
  width?: number;
  className?: string;
  tone?: BrandLogoTone;
  /** Accessibility label for marks that replace visible text. */
  'aria-label'?: string;
  /** When true, image is decorative (no label). */
  'aria-hidden'?: boolean;
};
