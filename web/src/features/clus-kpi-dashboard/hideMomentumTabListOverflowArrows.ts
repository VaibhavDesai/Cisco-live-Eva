/**
 * Momentum TabList toggles scroll arrows when tabs overflow. With flush left alignment
 * (see index.css on `mdc-tablist::part(container)`), the first tab's left edge can equal
 * the container's; the library treats that as "scrolled" and shows the back arrow spuriously.
 * ClusKpiDashboardRoot hides both overflow buttons for the Observability tab bar (Dashboard, Interactions, Configuration).
 */

export function hideMomentumTabListOverflowArrows(host: HTMLElement) {
  const root = host.shadowRoot;
  if (!root) return;
  root.querySelectorAll('mdc-button').forEach((node) => {
    const icon = node.getAttribute('prefix-icon') ?? '';
    if (icon.startsWith('arrow-')) {
      (node as HTMLElement).style.setProperty('display', 'none', 'important');
    }
  });
}

/**
 * Hide only the backward overflow control (visually the start / "left" scroll in LTR).
 * In RTL that control uses `arrow-right-regular`; forward uses `arrow-left-regular`.
 * When only one arrow is rendered, the first `mdc-button` may be forward — match by icon prefix, not index.
 */
export function hideMomentumTabListBackwardArrow(host: HTMLElement) {
  const root = host.shadowRoot;
  if (!root) return;
  const rtl =
    document.documentElement.getAttribute('dir') === 'rtl' ||
    getComputedStyle(host).direction === 'rtl';
  const backwardIconPrefix = rtl ? 'arrow-right' : 'arrow-left';
  root.querySelectorAll('mdc-button').forEach((node) => {
    const icon = node.getAttribute('prefix-icon') ?? '';
    if (icon.startsWith(backwardIconPrefix)) {
      (node as HTMLElement).style.setProperty('display', 'none', 'important');
    }
  });
}
