// Runtime-model tests load ActionControls through Vite SSR but do not render its UI.
// Keep Momentum's browser-only custom elements out of that Node-only code path.
export const Banner = () => null;
export const Checkbox = () => null;
export const IconProvider = () => null;
export const Input = () => null;
export const MenuItemRadio = () => null;
export const MenuPopover = () => null;
export const Option = () => null;
export const Radio = () => null;
export const RadioGroup = () => null;
export const Select = () => null;
export const Selectlistbox = () => null;
export const StaticChip = () => null;
export const Textarea = () => null;
export const Tooltip = () => null;
