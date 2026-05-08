/**
 * Re-exports Momentum components with relaxed typing for icon name strings used in this feature.
 */
import {
  AlertChip as MomentumAlertChip,
  Badge,
  Banner,
  Button as MomentumButton,
  ButtonGroup as MomentumButtonGroup,
  Checkbox,
  Icon as MomentumIcon,
  Input,
  LinkButton as MomentumLinkButton,
  Option as MomentumOption,
  Radio,
  RadioGroup,
  Searchfield as MomentumSearchfield,
  Select as MomentumSelect,
  Selectlistbox as MomentumSelectlistbox,
  Slider as MomentumSlider,
  Tab,
  TabList,
  Toggle,
} from '@momentum-design/components/react';

export const AlertChip = MomentumAlertChip as any;
export const Button = MomentumButton as any;
export const ButtonGroup = MomentumButtonGroup as any;
export const Icon = MomentumIcon as any;
export const LinkButton = MomentumLinkButton as any;
export const Searchfield = MomentumSearchfield as any;
export const Select = MomentumSelect as any;
export const Selectlistbox = MomentumSelectlistbox as any;
export const Option = MomentumOption as any;
export const Slider = MomentumSlider as any;
export { Badge, Banner, Checkbox, Input, Radio, RadioGroup, Tab, TabList, Toggle };
