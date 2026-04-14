# Shared Component Library Reference

> Single source of truth for every reusable component in `web/src/components/shared/`.
> Each entry shows **when to use**, a **do/don't** pair, and a **quick-start snippet**.
> For prop-level detail, see the JSDoc in each file.

---

## Table of Contents

| Category | Components |
|---|---|
| [Actions](#actions) | Button, TextLink, FilterPill |
| [Data Display](#data-display) | Badge, Table, Avatar, ProgressBar, Spinner |
| [Feedback](#feedback) | Banner, Toast, EmptyState, AnnouncementDialog |
| [Forms](#forms) | FormInput (Input, Textarea, Select), Dropdown, ComboBox, Checkbox, Radio, Toggle, Slider, DatePicker, TimePicker, SearchField, PasswordInput |
| [Layout](#layout) | Card, Accordion, Tabs, ListItem, Pagination, Decorator, Toolbar |
| [Overlays](#overlays) | Modal, Dialog, Popover, Tooltip, Menu |
| [Navigation](#navigation) | AppHeader, SideNav, ProductSelector |
| [Utility](#utility) | Icon, Illustration, ThemeToggle, TooltipTonalBackdrop |
| [Showcase](#showcase) | Projects, Dashboard (ComponentShowcase) |
| [AI Components](#ai-components) | AiSymbol, AiButton, AiFooter, AiWelcome, AiNavRail, AiShell, AiContainerHeader, AiChatTextArea, AiConversation, AiAssistant, AiNotification, AiNotifications, AiThreadPanel, AiUserMessage, AiResponseMessage |

---

## Actions

### Button

Primary call-to-action element mapped to Momentum `.btn` classes.

```tsx
import Button from './Button';

<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="secondary" size="sm">Cancel</Button>
```

| Do | Don't |
|---|---|
| Use `variant="primary"` for the main page action | Put two primary buttons side by side |
| Pass `disabled` for async states | Use an `<a>` styled as a button — use `TextLink` |
| Spread native `<button>` attrs for `aria-*` | Wrap in another `<button>` element |

---

### TextLink

Momentum hyperlink with standalone and inline variants.

```tsx
import { TextLink } from './TextLink';

<TextLink href="/docs">Documentation</TextLink>
<TextLink variant="inline" size="sm" href="/help">Learn more</TextLink>
```

| Do | Don't |
|---|---|
| Use `variant="inline"` inside paragraphs | Use `TextLink` for primary actions — use `Button` |
| Set `iconTrailing` for external links | Set `disabled` on actual navigation — hide or explain |

---

### FilterPill

Toggle chip for filter bars. Sets `aria-pressed` automatically.

```tsx
import { FilterPill } from './FilterPill';

<FilterPill selected={isActive} onClick={toggle}>Active</FilterPill>
```

| Do | Don't |
|---|---|
| Group multiple pills in a flex row | Use for navigation — use `Tabs` |
| Reflect `selected` from filter state | Hardcode `aria-pressed` — the component handles it |

---

## Data Display

### Badge

Status label (text pill), indicator (dot/counter/icon), and overlay wrapper.

```tsx
import Badge, { BadgeIndicator, BadgeOverlay } from './Badge';

<Badge variant="success">Active</Badge>

<BadgeOverlay badge={<BadgeIndicator type="counter" count={5} />}>
  <Icon name="alert" />
</BadgeOverlay>
```

| Do | Don't |
|---|---|
| Use `BadgeIndicator type="dot"` for unread markers | Put long text inside `Badge` — keep it to 1-2 words |
| Wrap trigger elements with `BadgeOverlay` | Nest `BadgeOverlay` inside another `BadgeOverlay` |

---

### Table

Semantic data table with sortable headers and empty/loading states.

```tsx
import Table, { TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';

<Table stickyHeader>
  <TableHead>
    <TableRow>
      <TableHeader sortDirection="asc" onSort={handleSort}>Name</TableHeader>
      <TableHeader>Status</TableHeader>
    </TableRow>
  </TableHead>
  <TableBody loading={isLoading} empty={items.length === 0} colSpan={2}>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell><Badge variant="success">Active</Badge></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

| Do | Don't |
|---|---|
| Set `colSpan` on `TableBody` to match column count for empty state | Use `<div>` grids for tabular data |
| Use `stickyHeader` in scrollable containers | Put interactive forms inside `TableCell` — use a modal |
| Pass `loading` and `empty` to `TableBody` | Manually render empty-state rows |

---

### Avatar

Photo, initials, or icon avatar with size tokens from Figma.

```tsx
import Avatar from './Avatar';

<Avatar src="/photo.jpg" alt="Jane" size="medium" />
<Avatar variant="initials" initials="JD" size="x-small" />
<Avatar variant="icon" icon="bot" size="large" />
```

| Do | Don't |
|---|---|
| Always provide `alt` text for photos | Use raw `<img>` tags for user photos |
| Use Figma size tokens (`x-small`…`xx-large`) or px numbers | Hard-code pixel sizes as inline styles |

---

### ProgressBar

Determinate progress indicator with optional label and percentage.

```tsx
import { ProgressBar } from './ProgressBar';

<ProgressBar value={65} label="Uploading..." showPercent />
<ProgressBar value={100} status="success" label="Complete" />
```

| Do | Don't |
|---|---|
| Set `status="success"` or `"error"` on completion | Animate `value` with `setInterval` — let your async handler drive it |
| Use `variant="inline"` for compact rows | Show a progress bar for indeterminate waits — use `Spinner` |

---

### Spinner

Loading indicator with `role="status"`.

```tsx
import Spinner from './Spinner';

<Spinner size="midsize" aria-label="Loading agents" />
```

| Do | Don't |
|---|---|
| Provide a meaningful `aria-label` | Use `Spinner` for determinate progress — use `ProgressBar` |
| Center within the loading region | Show multiple spinners in the same viewport |

---

## Feedback

### Banner

Inline alert strip for info, warning, error, or success messages.

```tsx
import { Banner, PromoBanner } from './Banner';

<Banner type="warning" title="API key expires soon" dismissable onDismiss={handleClose} />

<PromoBanner
  title="Try the new AI Assistant"
  actions={[{ label: 'Learn more', onClick: openDocs }]}
/>
```

| Do | Don't |
|---|---|
| Use `type` to convey severity (info/warning/error/success) | Stack multiple banners — consolidate or use `Toast` |
| Provide `onDismiss` so users can close | Use `Banner` for blocking errors — use a `Dialog` |

---

### Toast

Non-blocking notification via `ToastProvider` + `useToast` hook.

```tsx
import ToastProvider, { useToast } from './Toast';

// Wrap app once
<ToastProvider>{children}</ToastProvider>

// In any component
const { notify } = useToast();
notify({ type: 'success', title: 'Saved', message: 'Agent updated.' });
```

| Do | Don't |
|---|---|
| Wrap at the app root; call `notify` from any depth | Import `ToastProvider` in every component |
| Set `duration` for time-sensitive toasts | Use toasts for critical errors that need user action — use `Dialog` |

---

### EmptyState

Placeholder for empty lists, search results, or first-run pages.

```tsx
import { EmptyState } from './EmptyState';

<EmptyState
  title="No agents yet"
  description="Create your first agent to get started."
  illustration="empty-agents"
  actions={<Button onClick={create}>Create agent</Button>}
/>
```

| Do | Don't |
|---|---|
| Use `illustration` for Momentum NPM illustrations | Pass a raw `<img>` — use `graphic` for custom elements |
| Add at least one action CTA | Show `EmptyState` when data is loading — use `Spinner` |

---

### AnnouncementDialog

Promotional modal with illustration slot and up to two actions.

```tsx
import { AnnouncementDialog } from './AnnouncementDialog';

<AnnouncementDialog
  open={show}
  onClose={dismiss}
  title="What's new"
  description="We've added AI-powered suggestions."
  primaryAction={{ label: 'Try it', onClick: goToAI }}
/>
```

| Do | Don't |
|---|---|
| Use for feature announcements and onboarding | Use for destructive confirmations — use `Dialog` |
| Provide `onClose` to respect user dismissal | Show on every visit — persist dismissal state |

---

## Forms

### FormInput (Input, Textarea, Select)

Unified form field chrome with validation, hints, and character counts.

```tsx
import Input, { Textarea, Select, Option, FormGroup, FormLabel } from './FormInput';

<FormGroup>
  <Input label="Agent name" required validation="error" hint="Name is required" />
  <Textarea label="Description" maxLength={500} showCharCount />
  <Select label="Type" required>
    <Option value="scripted">Scripted</Option>
    <Option value="ai">AI</Option>
  </Select>
</FormGroup>
```

| Do | Don't |
|---|---|
| Use `validation` + `hint` together for error messages | Show validation on pristine fields |
| Use `FormGroup` to space related fields | Put `<input>` elements outside the shared wrappers |
| Set `maxLength` + `showCharCount` for bounded text | Rely solely on browser validation |

---

### Dropdown

Single-select with keyboard navigation and portaled listbox.

```tsx
import Dropdown from './Dropdown';

<Dropdown
  label="Region"
  options={[{ value: 'us', label: 'US' }, { value: 'eu', label: 'EU' }]}
  value={region}
  onChange={setRegion}
/>
```

| Do | Don't |
|---|---|
| Use for 3-10 static options | Use for 50+ items — use `ComboBox` with filtering |
| Set `size="compact"` in dense layouts | Build a custom `<div>` dropdown |

---

### ComboBox

Filterable single-select with typeahead and portaled listbox.

```tsx
import ComboBox from './ComboBox';

<ComboBox
  label="Agent"
  options={agents.map(a => ({ value: a.id, label: a.name }))}
  value={selected}
  onChange={setSelected}
/>
```

| Do | Don't |
|---|---|
| Use when the option list is large or dynamic | Use for fewer than 5 static options — use `Dropdown` |
| Provide `onInputChange` for server-side filtering | Forget `label` — it is required for accessibility |

---

### Checkbox / CheckboxGroup

```tsx
import { Checkbox, CheckboxGroup } from './Checkbox';

<CheckboxGroup label="Features" required>
  <Checkbox label="Voice" checked={voice} onChange={setVoice} />
  <Checkbox label="Chat" checked={chat} onChange={setChat} />
</CheckboxGroup>
```

| Do | Don't |
|---|---|
| Use `CheckboxGroup` with a visible `label` | Use a checkbox as a toggle switch — use `Toggle` |
| Set `indeterminate` for parent "select all" checkboxes | Use `Checkbox` for mutually exclusive choices — use `Radio` |

---

### Radio / RadioGroup

```tsx
import { Radio, RadioGroup } from './Radio';

<RadioGroup name="mode" label="Mode" value={mode} onChange={setMode}>
  <Radio value="scripted" label="Scripted" />
  <Radio value="ai" label="AI-Powered" />
</RadioGroup>
```

| Do | Don't |
|---|---|
| Always wrap in `RadioGroup` with a `name` | Use `Radio` standalone without a group |
| Use for 2-5 mutually exclusive choices | Use for many options — use `Dropdown` or `ComboBox` |

---

### Toggle / ToggleGroup

On/off switch with optional group wrapper.

```tsx
import Toggle, { ToggleGroup } from './Toggle';

<ToggleGroup label="Notifications">
  <Toggle label="Email" checked={email} onChange={setEmail} />
  <Toggle label="Push" checked={push} onChange={setPush} />
</ToggleGroup>
```

| Do | Don't |
|---|---|
| Use for instant on/off settings | Use for form submissions that require a "save" — use `Checkbox` |
| Use `size="compact"` in table rows | Put more than 5 toggles in a group — rethink the UI |

---

### Slider

Single-value or range slider with optional ticks and tooltip.

```tsx
import { Slider } from './Slider';

<Slider label="Confidence" value={0.8} min={0} max={1} step={0.1} onChange={setConf} />
<Slider label="Price range" value={[20, 80]} onChange={setRange} showTooltip />
```

| Do | Don't |
|---|---|
| Set `min`, `max`, `step` explicitly | Use a slider for precise numeric input — use `Input type="number"` |
| Use `showTicks` for discrete steps | Omit `label` or `aria-label` — sliders need accessible names |

---

### DatePicker

Calendar popup for single-date selection.

```tsx
import { DatePicker } from './DatePicker';

<DatePicker value={date} onChange={setDate} minDate={new Date()} />
```

| Do | Don't |
|---|---|
| Constrain with `minDate` / `maxDate` | Use for date ranges — build a two-picker pattern |
| Handle `null` value for cleared state | Format dates yourself — the component handles display |

---

### TimePicker

Spin-field + dropdown for time selection.

```tsx
import TimePicker from './TimePicker';

<TimePicker label="Start time" value={{ hour: 9, minute: 0 }} onChange={setTime} />
```

| Do | Don't |
|---|---|
| Set `interval={15}` for 15-min increments | Combine with `DatePicker` in the same field — stack vertically |
| Use `use12hr={false}` for 24-hour contexts | Forget to handle the `{ hour, minute }` shape |

---

### SearchField

Search input with chip filters and clear button.

```tsx
import SearchField from './SearchField';

<SearchField
  placeholder="Search agents..."
  value={query}
  onChange={setQuery}
  filters={activeFilters}
  onRemoveFilter={removeFilter}
/>
```

| Do | Don't |
|---|---|
| Debounce `onChange` for server-side search | Use for simple text fields — use `Input` |
| Display active filters as chips | Manually build filter chip logic |

---

### PasswordInput

Password field with show/hide toggle.

```tsx
import PasswordInput from './PasswordInput';

<PasswordInput label="Password" value={pw} onChange={setPw} validation="error" helperText="Too short" />
```

| Do | Don't |
|---|---|
| Use `validation` + `helperText` for strength feedback | Use a raw `Input type="password"` — this adds the toggle |
| Allow paste (the component does by default) | Disable paste for security — it hurts UX and doesn't help security |

---

## Layout

### Card

Surface container with optional image, header, body, and footer slots.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from './Card';

<Card variant="border" clickable onClick={openDetail}>
  <CardHeader icon="bot" title="My Agent" subtitle="AI-powered" />
  <CardBody>Agent handles customer inquiries.</CardBody>
  <CardFooter><Button variant="tertiary">Configure</Button></CardFooter>
</Card>
```

| Do | Don't |
|---|---|
| Use compound sub-components for structure | Put raw text directly inside `Card` without `CardBody` |
| Set `clickable` for cards that navigate | Nest clickable cards inside clickable cards |
| Use `variant="ghost"` for borderless surfaces | Override card spacing with inline styles |

---

### Accordion

Expandable disclosure with group wrapper.

```tsx
import { AccordionGroup, AccordionItem } from './Accordion';

<AccordionGroup type="contained">
  <AccordionItem id="1" title="General">General settings...</AccordionItem>
  <AccordionItem id="2" title="Advanced">Advanced settings...</AccordionItem>
</AccordionGroup>
```

| Do | Don't |
|---|---|
| Provide unique `id` per item | Use accordion for navigation — use `Tabs` |
| Use `type="contained"` for card-like groups | Put critical info in collapsed sections by default |

---

### Tabs

Tab strip with panels; includes `SegmentControl` variant.

```tsx
import Tabs, { Tab, TabPanel } from './Tabs';

<Tabs aria-label="Settings">
  <Tab active={tab === 0} onClick={() => setTab(0)}>General</Tab>
  <Tab active={tab === 1} onClick={() => setTab(1)}>Advanced</Tab>
</Tabs>
<TabPanel active={tab === 0}>General content</TabPanel>
<TabPanel active={tab === 1}>Advanced content</TabPanel>
```

| Do | Don't |
|---|---|
| Wire `id` and `aria-controls` for accessibility | Use tabs for step-by-step wizards — use a stepper |
| Use `SegmentControl` for view-mode toggles | Put more than 6 tabs — consider a sidebar nav |

---

### ListItem

Rich list rows with leading/trailing slots and expandable content.

```tsx
import { List, ListItem, ListHeader } from './ListItem';

<List aria-label="Agents">
  <ListHeader>My Agents</ListHeader>
  <ListItem leading={<Avatar variant="icon" icon="bot" />} onClick={openAgent}>
    Customer Support Bot
  </ListItem>
</List>
```

| Do | Don't |
|---|---|
| Use `leading` / `trailing` slots for icons and metadata | Put complex forms inside list items |
| Use `expandedContent` for detail rows | Nest `List` inside `List` |

---

### Pagination

Page controls with optional page-size selector and range summary.

```tsx
import Pagination from './Pagination';

<Pagination page={1} pageCount={10} totalItems={97} onPageChange={setPage} />
```

| Do | Don't |
|---|---|
| Set `totalItems` to show "1-10 of 97" summary | Build custom page controls |
| Use `pageSizeOptions` for configurable page sizes | Show pagination for fewer than 10 items |

---

### Decorator

Visual separators: `Divider`, `Bullet`, `Marker`, `GrabberDivider`, `DividerWithLabel`.

```tsx
import { Divider, Bullet, DividerWithLabel } from './Decorator';

<Divider />
<DividerWithLabel label="or" />
<Bullet size="small" />
```

| Do | Don't |
|---|---|
| Use `Divider` between content sections | Use `<hr>` directly — the component handles styling |
| Use `DividerWithLabel` for "or" separators | Overuse decorators — whitespace is often enough |

---

### Toolbar

Namespaced building blocks for rich editor toolbars.

```tsx
import Toolbar from './Toolbar';

<Toolbar.ButtonGroup>
  <Toolbar.IconButton icon="bold" label="Bold" onClick={toggleBold} />
  <Toolbar.IconButton icon="italic" label="Italic" onClick={toggleItalic} />
  <Toolbar.Divider />
  <Toolbar.PillButton icon="link" label="Insert link" onClick={insertLink} />
</Toolbar.ButtonGroup>
```

| Do | Don't |
|---|---|
| Use `Toolbar.ButtonGroup` with `autoDividers` | Build toolbar layouts with raw `<button>` elements |
| Provide `label` for every `IconButton` (accessibility) | Mix `Toolbar.*` with non-toolbar components |

---

## Overlays

### Modal

Portal-based overlay with header, body, and footer composition.

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

{open && (
  <Modal onClose={close} size="md">
    <ModalHeader title="Create Agent" onClose={close} />
    <ModalBody>Form fields here...</ModalBody>
    <ModalFooter>
      <Button variant="secondary" onClick={close}>Cancel</Button>
      <Button onClick={save}>Create</Button>
    </ModalFooter>
  </Modal>
)}
```

| Do | Don't |
|---|---|
| Always provide `onClose` and a close button | Render `Modal` unconditionally — gate with `{open && ...}` |
| Use `ModalHeader` for consistent header chrome | Put scrolling content without `ModalBody` |
| Use `size="sm"` for confirmations, `"lg"` for complex forms | Nest modals inside modals |

---

### Dialog

In-tree (non-portaled) modal variant; compose with `ModalHeader`/`ModalBody`/`ModalFooter`.

```tsx
import { Dialog } from './Dialog';

<Dialog onClose={close} size="sm">
  <ModalHeader title="Confirm delete" onClose={close} />
  <ModalBody>This action cannot be undone.</ModalBody>
  <ModalFooter><Button onClick={confirm}>Delete</Button></ModalFooter>
</Dialog>
```

| Do | Don't |
|---|---|
| Use for in-page overlays that don't need portaling | Use for complex multi-step flows — use `Modal` |
| Use `variant="promotional"` for announcements | Forget `preventBackdropClose` for destructive actions |

---

### Popover

Anchored floating surface with optional backdrop.

```tsx
import { Popover } from './Popover';

<Popover open={open} onOpenChange={setOpen} anchorRef={btnRef} placement="bottom">
  <p>Popover content here</p>
</Popover>
```

| Do | Don't |
|---|---|
| Provide `anchorRef` from the trigger element | Use for tooltips — use `Tooltip` |
| Use `variant="contrast"` for dark surfaces | Put large forms inside popovers — use `Modal` |

---

### Tooltip / ToggleTip

Hover/focus tooltip and click-toggle info bubble.

```tsx
import { Tooltip, ToggleTip } from './Tooltip';

<Tooltip content="Copy to clipboard" placement="top">
  <button>Copy</button>
</Tooltip>

<ToggleTip content="This setting controls..." link={{ label: 'Docs', href: '/help' }}>
  <Icon name="info-circle" />
</ToggleTip>
```

| Do | Don't |
|---|---|
| Use `Tooltip` for icon-only buttons | Put interactive content in `Tooltip` — use `ToggleTip` or `Popover` |
| Use `ToggleTip` for help text with links | Set `delay={0}` — the default 200ms prevents flicker |

---

### Menu

Portaled context/action menu with keyboard navigation.

```tsx
import { MenuOverlay, MenuSection, MenuItem, MenuDivider, useMenu } from './Menu';

const { open, anchorRef, toggle, close } = useMenu();

<button ref={anchorRef} onClick={toggle}>Actions</button>
<MenuOverlay open={open} anchorRef={anchorRef} onClose={close}>
  <MenuSection header="Actions">
    <MenuItem label="Edit" icon="edit" onClick={edit} />
    <MenuItem label="Duplicate" icon="copy" onClick={dup} />
  </MenuSection>
  <MenuDivider />
  <MenuItem label="Delete" icon="delete" danger onClick={del} />
</MenuOverlay>
```

| Do | Don't |
|---|---|
| Use `useMenu` hook for open/close state | Build custom dropdown menus |
| Use `danger` for destructive items | Put more than 10 items — consider a different pattern |
| Set `shortcut` for keyboard shortcuts display | Use `Menu` for navigation — use `SideNav` |

---

## Navigation

### AppHeader

Application shell header with brand, search, utilities, and avatar.

```tsx
import AppHeader from './AppHeader';

<AppHeader
  productName="AI Agent Studio"
  showSearch
  onSearch={handleSearch}
  avatarSrc="/user.jpg"
  onAvatarClick={openProfile}
/>
```

| Do | Don't |
|---|---|
| Use one `AppHeader` per page at the top | Nest `AppHeader` inside other layout components |
| Set `fixed` for sticky headers | Duplicate search in header and page body |

---

### SideNav

Collapsible sidebar with sections, items, and flyout submenus.

```tsx
import SideNav from './SideNav';

<SideNav collapsed={isCollapsed}>
  <SideNav.Upper>
    <SideNav.Section header="Main">
      <SideNav.Item icon="home" label="Dashboard" active onClick={goHome} />
      <SideNav.Item icon="bot" label="Agents" onClick={goAgents} />
    </SideNav.Section>
  </SideNav.Upper>
  <SideNav.Footer>
    <SideNav.Item icon="settings" label="Settings" onClick={goSettings} />
  </SideNav.Footer>
</SideNav>
```

| Do | Don't |
|---|---|
| Use compound `SideNav.*` sub-components | Build nav with raw `<ul>` / `<li>` |
| Use `SideNav.Divider` between sections | Put more than 2 levels deep — flatten the hierarchy |
| Wire `collapsed` to a toggle button | Forget `label` — it powers the collapsed tooltip |

---

### ProductSelector

Fixed two-option product switcher.

```tsx
import ProductSelector from './ProductSelector';

<ProductSelector value="agent-studio" onChange={switchProduct} />
```

| Do | Don't |
|---|---|
| Place inside `SideNav.Footer` or header | Modify the product list — it is hardcoded |

---

## Utility

### Icon (JSX)

Lazy-loaded Momentum icon by ID. Uses an in-memory SVG cache.

```tsx
import Icon from './Icon';

<Icon name="settings" size={24} />
<Icon name="delete" size={16} ariaLabel="Delete" className="icon-danger" />
```

| Do | Don't |
|---|---|
| Always set `ariaLabel` when the icon conveys meaning | Use for decorative icons without `ariaLabel` — add `aria-hidden` via spread |
| Use the canonical `web/src/icons/Icon.tsx` for TypeScript files | Import `shared/Icon.jsx` in new TypeScript components |

> **Note:** TypeScript components should import from `../../icons/Icon` which accepts `name` + `weight` as separate props. This JSX version combines them (e.g., `name="cancel-bold"`).

---

### Illustration (JSX)

Lazy-loaded Momentum illustration from NPM CDN.

```tsx
import Illustration from './Illustration';

<Illustration name="empty-state" size="onetwozero" variant="empty-primary" />
```

| Do | Don't |
|---|---|
| Use Momentum illustration IDs from the catalog | Pass arbitrary image URLs — use `<img>` |
| Use `fullId` to override the auto-generated ID | Import `assets/illustrations` for the same purpose — that is for static SVGs |

---

### ThemeToggle

Toggles light/dark theme on `<html>` and persists to `localStorage`.

```tsx
import ThemeToggle from './ThemeToggle';

<ThemeToggle />
```

| Do | Don't |
|---|---|
| Place in `AppHeader` or settings page | Render multiple `ThemeToggle` instances |

---

### TooltipTonalBackdrop

SVG backdrop for tonal tooltip/popover surfaces. No props.

```tsx
import { TooltipTonalBackdrop } from './TooltipTonalBackdrop';

<div className="popover-tonal"><TooltipTonalBackdrop />Content</div>
```

| Do | Don't |
|---|---|
| Drop inside tonal surfaces that need the Momentum gradient | Use standalone — it is a visual helper only |

---

## Showcase

### Projects

Sample "Projects" page with mock agent management. No props.

```tsx
import Projects from './Projects';
<Projects />
```

---

### Dashboard (ComponentShowcase)

In-app component library and demo surface. Exported as `ComponentShowcase` from `index.ts`.

```tsx
import { ComponentShowcase } from '../shared';
<ComponentShowcase />
```

---

## AI Components

All AI components live in `shared/ai/` and are re-exported from `shared/index.ts`.

### AiSymbol

Branded AI mark with static, processing, and responding motion states.

```tsx
import { AiSymbol } from '../shared';

<AiSymbol state="processing" size="medium" />
```

| Do | Don't |
|---|---|
| Use `state` to reflect AI processing status | Animate manually — the component handles it |

---

### AiButton

Suggestion CTAs: `AiPromptButton` (text chip) and `AiPromptCardButton` (card chip).

```tsx
import { AiPromptButton, AiPromptCardButton } from '../shared';

<AiPromptButton onClick={suggest}>Summarize</AiPromptButton>
<AiPromptCardButton onClick={suggest}>Draft response</AiPromptCardButton>
```

| Do | Don't |
|---|---|
| Use inside `AiWelcome` or `AiFooter` suggestion areas | Use as general-purpose buttons — use `Button` |

---

### AiFooter

Composer strip with suggestion chips, processing indicator, and disclaimer.

```tsx
import { AiFooter } from '../shared';

<AiFooter
  onSend={handleSend}
  processing={isThinking}
  suggestions={['Summarize', 'Draft reply']}
/>
```

| Do | Don't |
|---|---|
| Set `processing` during AI response generation | Build a custom composer — this handles enter-to-send and chips |

---

### AiWelcome

Empty-state hero for AI assistant with suggestion chips.

```tsx
import { AiWelcome } from '../shared';

<AiWelcome firstTime suggestions={['What can you do?']} onSelectSuggestion={ask} />
```

| Do | Don't |
|---|---|
| Show when conversation is empty | Show alongside messages — hide when messages exist |

---

### AiNavRail

Vertical mode switcher for conversation/notifications/settings views.

```tsx
import { AiNavRail } from '../shared';

<AiNavRail activeView="conversation" onViewChange={setView} notificationCount={3} />
```

---

### AiShell

AI assistant window container with overlay and view-mode support.

```tsx
import { AiShell } from '../shared';

<AiShell open={isOpen} viewMode="floating-lg" onClose={close} onViewModeChange={setMode}>
  {children}
</AiShell>
```

| Do | Don't |
|---|---|
| Control `open` from a global AI button | Render multiple shells — one per app |

---

### AiContainerHeader

Shell chrome with pop-out, view-mode menu, and close controls.

```tsx
import { AiContainerHeader } from '../shared';

<AiContainerHeader title="AI Assistant" viewMode="docked" onClose={close} onViewModeChange={setMode} />
```

---

### AiChatTextArea

Auto-growing composer with sources selector and Enter-to-send.

```tsx
import { AiChatTextArea } from '../shared';

<AiChatTextArea value={text} onChange={setText} onSend={send} placeholder="Ask AI..." />
```

| Do | Don't |
|---|---|
| Use controlled `value` + `onChange` | Build a custom `<textarea>` for AI chat |

---

### AiConversation

Full conversation view with thread rail, message stream, and footer.

```tsx
import { AiConversation } from '../shared';

<AiConversation
  messages={messages}
  onSend={send}
  processing={isThinking}
  threads={threads}
  showThreads
  activeThreadId={activeId}
  onSelectThread={select}
/>
```

---

### AiAssistant

End-to-end demo wiring: shell + rail + conversation + dialogs with mock data.

```tsx
import { AiAssistant } from '../shared';

<AiAssistant open={isOpen} onClose={close} />
```

---

### AiNotification

Single notification row with optional actions and overflow menu.

```tsx
import { AiNotification } from '../shared';

<AiNotification title="New insight" body="Your agent handled 50 queries today." time="2m ago" />
```

---

### AiNotifications

Notification list panel with All/Unread filter tabs.

```tsx
import { AiNotifications } from '../shared';

<AiNotifications notifications={items} onAction={handleAction} onMore={handleMore} />
```

---

### AiThreadPanel

Grouped thread list with context menu (rename/delete) and new-thread button.

```tsx
import { AiThreadPanel } from '../shared';

<AiThreadPanel
  threads={threads}
  activeThreadId={activeId}
  onSelectThread={select}
  onNewThread={create}
  onRenameThread={rename}
  onDeleteThread={del}
/>
```

---

### AiUserMessage

User chat bubble with avatar.

```tsx
import { AiUserMessage } from '../shared';

<AiUserMessage text="How do I create an agent?" avatarSrc="/user.jpg" />
```

---

### AiResponseMessage

AI reply bubble with sources accordion, feedback buttons, and follow-up chips.

```tsx
import { AiResponseMessage } from '../shared';

<AiResponseMessage
  content="Here's how to create an agent..."
  sources={[{ title: 'Docs', url: '/docs' }]}
  onCopy={copy}
  onThumbsUp={thumbsUp}
  onThumbsDown={thumbsDown}
  followups={['Tell me more', 'Show example']}
  onFollowup={ask}
/>
```

| Do | Don't |
|---|---|
| Pass `content` as string for auto-paragraph splitting | Manually split paragraphs — the component handles newlines |
| Use `followups` for suggested next questions | Put buttons inside `content` — use `followups` |

---

### DeleteThreadDialog / RenameThreadDialog

Confirmation dialogs for thread management.

```tsx
import DeleteThreadDialog from './DeleteThreadDialog';
import RenameThreadDialog from './RenameThreadDialog';

<DeleteThreadDialog open={show} threadName="My Chat" onDelete={del} onCancel={close} />
<RenameThreadDialog open={show} currentName="My Chat" onSave={save} onCancel={close} />
```

| Do | Don't |
|---|---|
| Use these from `AiThreadPanel` context menu handlers | Build custom delete/rename dialogs for threads |
