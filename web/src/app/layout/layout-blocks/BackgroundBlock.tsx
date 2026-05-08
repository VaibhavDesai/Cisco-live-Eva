/**
 * Background block – full-viewport layer behind all content.
 * Matches Figma design: base solid color + soft gradient overlay (peach top-left, blue top-right).
 * Supports light/dark via CSS variables. Configurable via --app-bg-color, --app-bg-image.
 */
export function BackgroundBlock() {
  return (
    <div className="app-layout-background" aria-hidden />
  );
}
