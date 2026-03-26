import type { BrandLogoTone } from './types';

/** Map Figma “light / dark logo” contexts to CSS fill/color. */
export function logoFill(tone: BrandLogoTone | undefined): string {
  switch (tone) {
    case 'onDark':
      return '#ffffff';
    case 'onLight':
      return '#000000';
    default:
      return 'currentColor';
  }
}
