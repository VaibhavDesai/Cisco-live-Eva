import { useState, useRef, useEffect, useCallback } from 'react'
import Button from './Button'
import SearchField from './SearchField'
import Icon from './Icon'
import Toggle from './Toggle'
import TimePicker from './TimePicker'
import PasswordInput from './PasswordInput'
import DatePicker from './DatePicker'
import Card from './Card'
import Badge, { BadgeOverlay } from './Badge'
import Avatar from './Avatar'
import AppHeader from './AppHeader'
import AnnouncementDialog from './AnnouncementDialog'
import Accordion, { AccordionGroup } from './Accordion'
import Toolbar from './Toolbar'
import SideNav from './SideNav'
import AiSymbol from './ai/AiSymbol'
import { AiPromptButton, AiPromptCardButton } from './ai/AiButton'
import AiChatTextArea from './ai/AiChatTextArea'
import AiContainerHeader from './ai/AiContainerHeader'
import AiNotification from './ai/AiNotification'
import Illustration from './Illustration'

/**
 * Searchable "Component Library" showcase page that renders Momentum primitives, layout patterns, and AI demos.
 * @param {Object} props - Unused; all showcase interactions use internal React state.
 * @example
 * <Dashboard />
 */

/* ─── Momentum icon wrappers (replacing inline SVGs) ─────── */
const IconPlus = () => <Icon name="plus-bold" size={16} />
const IconCheck = ({ size = 12 }) => <Icon name="check-bold" size={size} />
const IconX = ({ size = 12 }) => <Icon name="cancel-bold" size={size} />
const IconChevron = ({ size = 16, direction = 'down' }) => {
  const rotation = { down: 0, up: 180, left: 90, right: -90 }[direction]
  return <Icon name="arrow-down-bold" size={size} style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined} />
}
const IconInfo = ({ size = 16 }) => <Icon name="info-circle-bold" size={size} />
const IconWarning = ({ size = 16 }) => <Icon name="warning-bold" size={size} />
const IconCheckCircle = ({ size = 16 }) => <Icon name="check-circle-bold" size={size} />
const IconAlertCircle = ({ size = 16 }) => <Icon name="error-legacy-bold" size={size} />
const IconSearch = ({ size = 16 }) => <Icon name="search-bold" size={size} />
const IconStar = ({ size = 16 }) => <Icon name="favorite-filled" size={size} />
const IconMinus = ({ size = 12 }) => <Icon name="minus-bold" size={size} />
const IconArrowRight = ({ size = 16 }) => <Icon name="arrow-right-bold" size={size} />
const IconGrid = ({ size = 18 }) => <Icon name="applications-filled" size={size} />
const IconList = ({ size = 18 }) => <Icon name="view-list-bold" size={size} />

/* ─── Section wrapper ───────────────────────────────────────── */
/**
 * Showcase section with heading and optional description; hidden when the search query does not match title or description.
 * @param {Object} props
 * @param {string} props.title - Section heading; included in search matching.
 * @param {string} [props.desc] - Optional blurb under the heading; included in search matching when provided.
 * @param {string} props.searchQuery - Lowercased filter string; the section is omitted if neither title nor description matches.
 * @param {import('react').ReactNode} props.children - Demo markup rendered inside the section.
 * @example
 * <Section title="App Header" desc="Shell header" searchQuery="header" children={node} />
 */
function Section({ title, desc, searchQuery, children }) {
  if (searchQuery && !title.toLowerCase().includes(searchQuery) && !(desc && desc.toLowerCase().includes(searchQuery))) {
    return null
  }
  return (
    <section className="showcase-section">
      <h2 className="showcase-title">{title}</h2>
      {desc && <p className="showcase-desc">{desc}</p>}
      {children}
    </section>
  )
}

/**
 * Interactive row that previews the AiSymbol component across static, processing, and responding states.
 * @param {Object} props - Unused; demo state is held locally.
 * @example
 * <AiSymbolDemo />
 */
function AiSymbolDemo() {
  const [sym, setSym] = useState('static')
  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
      <AiSymbol size={64} state={sym} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['static', 'processing', 'responding'].map(s => (
          <button
            key={s}
            className={`btn ${sym === s ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}
            onClick={() => setSym(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Dashboard (Component Library Showcase) ────────────────── */
function Dashboard() {
  const [pillTab, setPillTab] = useState(0)
  const [glassTab, setGlassTab] = useState(0)
  const [lineTab, setLineTab] = useState(1)
  const [vertTab, setVertTab] = useState(0)
  const [segment, setSegment] = useState(0)
  const [viewMode, setViewMode] = useState('grid')

  const [toggleA, setToggleA] = useState(false)
  const [toggleB, setToggleB] = useState(true)
  const [compactToggle, setCompactToggle] = useState(false)

  const [timeVal, setTimeVal] = useState(null)
  const [timeVal2, setTimeVal2] = useState({ hour: 14, minute: 30 })

  const [password, setPassword] = useState('')
  const [passwordFilled, setPasswordFilled] = useState('s3cureP@ss')
  const [dateVal, setDateVal] = useState(null)
  const [dateVal2, setDateVal2] = useState(new Date())

  const [cardSelected, setCardSelected] = useState(false)

  const [check1, setCheck1] = useState(false)
  const [check2, setCheck2] = useState(true)
  const [radioVal, setRadioVal] = useState('opt1')

  const [modalOpen, setModalOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)


  const [sliderVal, setSliderVal] = useState(40)
  const sliderRef = useRef(null)
  const [searchVal, setSearchVal] = useState('')
  const [dashSearch, setDashSearch] = useState('')
  const normalizedDashSearch = dashSearch.trim().toLowerCase()

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false)
    }
    const esc = (e) => { if (e.key === 'Escape') setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', esc)
    }
  }, [dropdownOpen])

  const handleSliderMove = useCallback((e) => {
    const track = sliderRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const pct = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    setSliderVal(Math.round(pct))
  }, [])

  const handleSliderDown = useCallback((e) => {
    handleSliderMove(e)
    const onMove = (ev) => handleSliderMove(ev)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [handleSliderMove])

  const tabLabels = ['Overview', 'Analytics', 'Settings']

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Component Library</h1>
      </div>
      <p className="page-subtitle" style={{ marginBottom: 'var(--spacing-small)' }}>
        All components from the Momentum Design System CSS library
      </p>
      <div style={{ maxWidth: 400, marginBottom: 'var(--spacing-medium)' }}>
        <SearchField
          placeholder="Search components..."
          value={dashSearch}
          onChange={setDashSearch}
          onClear={() => setDashSearch('')}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  APP HEADER                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="App Header" desc="Application shell header with branding, search, utility icons, and user avatar. Desktop and mobile variants.">
        <div className="showcase-label">Desktop — Default</div>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <AppHeader
            productName="AI Agent Studio"
            alertCount={3}
            avatarSrc="https://i.pravatar.cc/64?img=12"
            avatarName="Austen Jones"
          />
        </div>

        <div className="showcase-label">Desktop — No Search</div>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <AppHeader
            productName="Contact Center"
            showSearch={false}
            alertCount={0}
            avatarSrc="https://i.pravatar.cc/64?img=5"
            avatarName="Jane Doe"
          />
        </div>

        <div className="showcase-label">Desktop — No AI Button</div>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
          <AppHeader
            productName="Webex Events"
            showAiButton={false}
            alertCount={12}
            avatarName="Alex Kim"
          />
        </div>

        <div className="showcase-label">Mobile</div>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', maxWidth: 400, marginBottom: 16 }}>
          <AppHeader
            type="mobile"
            productName="AI Agent Studio"
          />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  1. BUTTONS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Buttons" desc="Pill button with variant, size, and validation options.">
        <div className="showcase-label">Primary — States</div>
        <div className="showcase-row" style={{ gap: 16 }}>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Normal</span>
            <Button variant="primary">Label</Button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Hover</span>
            <button className="btn btn-primary" style={{ background: 'var(--button-primary-hover)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Pressed</span>
            <button className="btn btn-primary" style={{ background: 'var(--button-primary-pressed)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Focus</span>
            <button className="btn btn-primary" style={{ boxShadow: '0 0 0 2px var(--focus-ring-0), 0 0 0 4px var(--focus-ring-1), 0 0 0 5px var(--focus-ring-2)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled</span>
            <Button variant="primary" disabled>Label</Button>
          </div>
        </div>

        <div className="showcase-label">Secondary — States</div>
        <div className="showcase-row" style={{ gap: 16 }}>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Normal</span>
            <Button variant="secondary">Label</Button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Hover</span>
            <button className="btn btn-secondary" style={{ background: 'var(--button-secondary-hover)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Pressed</span>
            <button className="btn btn-secondary" style={{ background: 'var(--button-secondary-active)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Focus</span>
            <button className="btn btn-secondary" style={{ boxShadow: '0 0 0 2px var(--focus-ring-0), 0 0 0 4px var(--focus-ring-1), 0 0 0 5px var(--focus-ring-2)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled</span>
            <Button variant="secondary" disabled>Label</Button>
          </div>
        </div>

        <div className="showcase-label">Tertiary — States</div>
        <div className="showcase-row" style={{ gap: 16 }}>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Normal</span>
            <Button variant="tertiary">Label</Button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Hover</span>
            <button className="btn btn-tertiary" style={{ background: 'var(--button-secondary-hover)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Pressed</span>
            <button className="btn btn-tertiary" style={{ background: 'var(--button-secondary-active)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Focus</span>
            <button className="btn btn-tertiary" style={{ boxShadow: '0 0 0 2px var(--focus-ring-0), 0 0 0 4px var(--focus-ring-1), 0 0 0 5px var(--focus-ring-2)' }}>Label</button>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Disabled</span>
            <Button variant="tertiary" disabled>Label</Button>
          </div>
        </div>

        <div className="showcase-label">Sizes</div>
        <div className="showcase-row">
          <Button variant="secondary" size={40}>40px</Button>
          <Button variant="secondary" size={32}>32px</Button>
          <Button variant="secondary" size={28}>28px</Button>
          <Button variant="secondary" size={24}>24px</Button>
        </div>

        <div className="showcase-label">With Icons</div>
        <div className="showcase-row">
          <Button variant="primary" size={32} leadingIcon={<IconPlus />}>Add New</Button>
          <Button variant="secondary" size={32} trailingIcon={<IconArrowRight />}>Next</Button>
          <Button variant="tertiary" size={28} leadingIcon={<IconSearch />}>Search</Button>
        </div>

        <div className="showcase-label">Validation</div>
        <div className="showcase-row">
          <Button variant="primary" validation="positive" size={32}>Positive</Button>
          <Button variant="primary" validation="negative" size={32}>Negative</Button>
          <Button variant="primary" validation="accent" size={32}>Accent</Button>
        </div>
        <div className="showcase-row">
          <Button variant="secondary" validation="positive" size={32}>Positive</Button>
          <Button variant="secondary" validation="negative" size={32}>Negative</Button>
          <Button variant="secondary" validation="accent" size={32}>Accent</Button>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  MOMENTUM ICONS                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Icons (Momentum Design)" desc="3,158 icons from @momentum-design/icons, lazy-loaded as inline SVGs via Vite import.meta.glob.">
        <div className="showcase-label">Common Icons (20px)</div>
        <div className="showcase-row">
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="search-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>search-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="cancel-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>cancel-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="check-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>check-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="plus-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>plus-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="settings-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>settings-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="arrow-right-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>arrow-right-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="info-badge-filled" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>info-badge-filled</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="warning-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>warning-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="delete-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>delete-bold</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="home-bold" size={20} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>home-bold</span>
          </div>
        </div>

        <div className="showcase-label">Sizes</div>
        <div className="showcase-row">
          {[12, 16, 20, 24, 32, 48].map((s) => (
            <div key={s} className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
              <Icon name="favorite-bold" size={s} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s}px</span>
            </div>
          ))}
        </div>

        <div className="showcase-label">Color Variants (via CSS)</div>
        <div className="showcase-row">
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
            <Icon name="chat-bold" size={24} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Default</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4, color: 'var(--accent-color)' }}>
            <Icon name="chat-bold" size={24} />
            <span style={{ fontSize: 11 }}>Accent</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4, color: 'var(--success-color)' }}>
            <Icon name="chat-bold" size={24} />
            <span style={{ fontSize: 11 }}>Success</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4, color: 'var(--warning-color)' }}>
            <Icon name="chat-bold" size={24} />
            <span style={{ fontSize: 11 }}>Warning</span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center', gap: 4, color: 'var(--danger-color)' }}>
            <Icon name="chat-bold" size={24} />
            <span style={{ fontSize: 11 }}>Error</span>
          </div>
        </div>

        <div className="showcase-label">Inside Buttons</div>
        <div className="showcase-row">
          <Button variant="primary" size={32} leadingIcon={<Icon name="plus-bold" size={16} />}>Create</Button>
          <Button variant="secondary" size={32} leadingIcon={<Icon name="search-bold" size={16} />}>Search</Button>
          <Button variant="tertiary" size={28} leadingIcon={<Icon name="settings-bold" size={14} />}>Settings</Button>
          <Button variant="primary" validation="negative" size={32} leadingIcon={<Icon name="delete-bold" size={16} />}>Delete</Button>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  2. CARDS                                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Cards" desc="Static, clickable, and selectable card variants with header, body, footer, and layout options.">
        <div className="showcase-label">Static</div>
        <div className="showcase-grid-3">
          <Card style={{ marginBottom: 0 }}>
            <Card.Header
              title="Standard Card"
              subtitle="With subtitle"
              actions={
                <button className="card-header-action" aria-label="More options">
                  <Icon name="more-bold" size={16} />
                </button>
              }
            />
            <Card.Content>
              <div className="card-body-text">This is the card body with some descriptive content.</div>
            </Card.Content>
            <Card.Footer>
              <a className="card-footer-link" href="#" onClick={(e) => e.preventDefault()}>
                Learn more <IconArrowRight size={14} />
              </a>
            </Card.Footer>
          </Card>

          <Card type="ghost" style={{ marginBottom: 0 }}>
            <Card.Header title="Ghost Card" />
            <Card.Content>
              <div className="card-body-text">Transparent background, no border.</div>
            </Card.Content>
          </Card>

          <Card disabled style={{ marginBottom: 0 }}>
            <Card.Header title="Disabled Card" />
            <Card.Content>
              <div className="card-body-text">Non-interactive disabled state.</div>
            </Card.Content>
          </Card>
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Clickable</div>
        <div className="showcase-grid-3">
          <Card variant="clickable" style={{ marginBottom: 0 }}>
            <Card.Header title="Clickable Card" subtitle="Rest state" />
            <Card.Content>
              <div className="card-body-text">Hover to see the interactive state. Supports hover, pressed, and focus-visible.</div>
            </Card.Content>
          </Card>

          <Card variant="clickable" disabled style={{ marginBottom: 0 }}>
            <Card.Header title="Clickable Disabled" />
            <Card.Content>
              <div className="card-body-text">Clickable card in disabled state.</div>
            </Card.Content>
          </Card>
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Selectable</div>
        <div className="showcase-grid-3">
          <Card
            variant="selectable"
            selected={cardSelected}
            onClick={() => setCardSelected((s) => !s)}
            style={{ marginBottom: 0 }}
          >
            <Card.Header
              title="Selectable Card"
              subtitle="Click to toggle"
              selectable
              selected={cardSelected}
            />
            <Card.Content>
              <div className="card-body-text">Click this card to toggle selection. Shows a check icon and accent border when selected.</div>
            </Card.Content>
          </Card>

          <Card variant="selectable" selected style={{ marginBottom: 0 }}>
            <Card.Header title="Selected Card" selectable selected />
            <Card.Content>
              <div className="card-body-text">Pre-selected state with accent border and filled check icon.</div>
            </Card.Content>
          </Card>

          <Card variant="selectable" disabled style={{ marginBottom: 0 }}>
            <Card.Header title="Disabled Selectable" selectable />
            <Card.Content>
              <div className="card-body-text">Selectable card in disabled state.</div>
            </Card.Content>
          </Card>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  3. BADGES                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Badges" desc="Text pill badges for status and labels.">
        <div className="showcase-row">
          <span className="badge">Default</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-danger">Danger</span>
          <span className="badge badge-info">Info</span>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  4. BADGE INDICATORS                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Badge Indicators" desc="Dot, counter, icon, and validation indicators with overlay positioning.">
        <div className="showcase-label">Dot</div>
        <div className="showcase-row">
          <Badge type="dot" />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Counter</div>
        <div className="showcase-row">
          <Badge type="counter" count={1} />
          <Badge type="counter" count={99} />
          <Badge type="counter" count={999} />
          <Badge type="counter" count={9999} />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Icon</div>
        <div className="showcase-row">
          <Badge type="icon" icon="check-circle-badge-filled" color="accent" />
          <Badge type="icon" icon="unread-filled" color="transparent" />
          <Badge type="icon" icon="mention-bold" color="accent" />
          <Badge type="icon" icon="announcement-bold" color="accent" />
          <Badge type="icon" icon="enter-room-bold" color="accent" />
          <Badge type="icon" icon="draft-indicator-bold" color="default" />
          <Badge type="icon" icon="alert-muted-bold" color="default" />
          <Badge type="icon" icon="alert-active-bold" color="default" />
          <Badge type="icon" icon="error-legacy-badge-filled" color="error" />
          <Badge type="icon" icon="blocked-bold" color="warning" />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Validation</div>
        <div className="showcase-row">
          <Badge type="success" />
          <Badge type="warning" />
          <Badge type="error" />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Overlay</div>
        <div className="showcase-row">
          <BadgeOverlay badge={<Badge type="counter" count={9} />}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconStar size={16} />
            </div>
          </BadgeOverlay>
          <BadgeOverlay badge={<Badge type="dot" />}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chat-bold" size={16} />
            </div>
          </BadgeOverlay>
          <BadgeOverlay badge={<Badge type="error" />}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alert-bold" size={16} />
            </div>
          </BadgeOverlay>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  5. LABEL CHIPS                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Label Chips" desc="Color-coded label chips for categorization.">
        <div className="showcase-row">
          <span className="label-chip label-chip-slate">Slate</span>
          <span className="label-chip label-chip-cobalt">Cobalt</span>
          <span className="label-chip label-chip-violet">Violet</span>
          <span className="label-chip label-chip-purple">Purple</span>
          <span className="label-chip label-chip-pink">Pink</span>
          <span className="label-chip label-chip-orange">Orange</span>
          <span className="label-chip label-chip-gold">Gold</span>
          <span className="label-chip label-chip-lime">Lime</span>
          <span className="label-chip label-chip-mint">Mint</span>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  6. ALERT CHIPS                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Alert Chips" desc="Semantic alert chips with icon slots.">
        <div className="showcase-row">
          <span className="alert-chip alert-chip-default">
            <span className="alert-icon"><IconInfo size={14} /></span> Default
          </span>
          <span className="alert-chip alert-chip-info">
            <span className="alert-icon"><IconInfo size={14} /></span> Info
          </span>
          <span className="alert-chip alert-chip-success">
            <span className="alert-icon"><IconCheckCircle size={14} /></span> Success
          </span>
          <span className="alert-chip alert-chip-warning">
            <span className="alert-icon"><IconWarning size={14} /></span> Warning
          </span>
          <span className="alert-chip alert-chip-error">
            <span className="alert-icon"><IconAlertCircle size={14} /></span> Error
          </span>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  7. TABLE                                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Table" desc="Data table with sortable headers, row states, and variants (compact, bordered, striped).">
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="table-header-sortable table-header-sorted">
                    <span className="table-header-content">Name <span className="table-sort-icon"><IconChevron size={12} /></span></span>
                  </th>
                  <th>Status</th>
                  <th>Role</th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="table-row-clickable">
                  <td>Alice Johnson</td>
                  <td><span className="badge badge-success">Active</span></td>
                  <td>Admin</td>
                  <td className="align-right"><Button variant="tertiary" size={24}>Edit</Button></td>
                </tr>
                <tr className="table-row-clickable">
                  <td>Bob Smith</td>
                  <td><span className="badge badge-warning">Pending</span></td>
                  <td>Editor</td>
                  <td className="align-right"><Button variant="tertiary" size={24}>Edit</Button></td>
                </tr>
                <tr className="table-row-selected">
                  <td>Carol Lee</td>
                  <td><span className="badge badge-info">Review</span></td>
                  <td>Viewer</td>
                  <td className="align-right"><Button variant="tertiary" size={24}>Edit</Button></td>
                </tr>
                <tr className="table-row-disabled">
                  <td>Dave Kim</td>
                  <td><span className="badge">Inactive</span></td>
                  <td>Viewer</td>
                  <td className="align-right"><Button variant="tertiary" size={24} disabled>Edit</Button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Empty State</div>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="table-container">
            <table>
              <thead><tr><th>Name</th><th>Status</th></tr></thead>
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <div className="table-empty-state">
                      <Illustration name="desert-open-results" size="oneninetwo" variant="empty-primary" width={120} height={96} style={{ margin: '0 auto 8px' }} />
                      <div className="table-empty-title">No results found</div>
                      <div className="table-empty-description">Try adjusting your search or filter criteria.</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  8. TABS                                              */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Tabs" desc="Pill (default), glass, line, and vertical tab variants.">
        <div className="showcase-label">Pill (Default)</div>
        <div className="tabs">
          {tabLabels.map((t, i) => (
            <button key={t} className={`tab${pillTab === i ? ' active' : ''}`} onClick={() => setPillTab(i)}>
              {t} {i === 1 && <span className="tab-badge">3</span>}
            </button>
          ))}
          <button className="tab" disabled>Disabled</button>
        </div>

        <div className="showcase-label">Glass</div>
        <div className="tabs tabs-glass">
          {tabLabels.map((t, i) => (
            <button key={t} className={`tab${glassTab === i ? ' active' : ''}`} onClick={() => setGlassTab(i)}>{t}</button>
          ))}
        </div>

        <div className="showcase-label">Line</div>
        <div className="tabs tabs-line">
          {tabLabels.map((t, i) => (
            <button key={t} className={`tab${lineTab === i ? ' active' : ''}`} onClick={() => setLineTab(i)}>{t}</button>
          ))}
          <button className="tab" disabled>Disabled</button>
        </div>

        <div className="showcase-label">Vertical</div>
        <div className="tabs tabs-vertical" style={{ maxWidth: 200 }}>
          {tabLabels.map((t, i) => (
            <button key={t} className={`tab${vertTab === i ? ' active' : ''}`} onClick={() => setVertTab(i)}>
              <span className="tab-label">{t}</span>
            </button>
          ))}
          <button className="tab" disabled><span className="tab-label">Disabled</span></button>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  9. SEGMENTED CONTROL & VIEW SWITCHER                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Segmented Control & View Switcher" desc="Pill-based segment controls and icon view toggles.">
        <div className="showcase-row-start">
          <div className="showcase-col">
            <div className="showcase-label">Segmented Control</div>
            <div className="segment-control" style={{ marginBottom: 0 }}>
              {['All', 'Active', 'Archived'].map((label, i) => (
                <button key={label} className={`segment-item${segment === i ? ' active' : ''}`} onClick={() => setSegment(i)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="showcase-col">
            <div className="showcase-label">View Switcher (Icons)</div>
            <div className="view-switcher">
              <button className={`view-switcher-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} aria-label="Grid view"><IconGrid /></button>
              <button className={`view-switcher-btn${viewMode === 'list' ? ' active' : ''}`} onClick={() => setViewMode('list')} aria-label="List view"><IconList /></button>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 10. FORM ELEMENTS                                     */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Form Elements" desc="Input fields, textarea, search, and combobox with validation states.">
        <div className="showcase-grid-2">
          <div className="form-group">
            <label className="form-label">Default Input</label>
            <input className="form-input" type="text" placeholder="Enter text..." />
          </div>
          <div className="form-group">
            <label className="form-label">With Wrapper + Icon</label>
            <div className="form-input-wrapper">
              <span className="form-input-icon"><IconSearch size={16} /></span>
              <input className="form-input" type="text" placeholder="Search..." />
              <button className="form-input-clear" aria-label="Clear"><IconX size={10} /></button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Error State</label>
            <input className="form-input error" type="text" defaultValue="Invalid value" />
            <span className="form-helper-text" style={{ color: 'var(--danger-color)', fontSize: 12 }}>This field is required.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Success State</label>
            <input className="form-input success" type="text" defaultValue="Valid input" />
          </div>
          <div className="form-group">
            <label className="form-label">Warning State</label>
            <input className="form-input warning" type="text" defaultValue="May need review" />
          </div>
          <div className="form-group">
            <label className="form-label">Disabled</label>
            <input className="form-input" type="text" disabled placeholder="Disabled..." />
          </div>
        </div>

        <div className="showcase-label">Search Field</div>
        <div style={{ maxWidth: 400 }}>
          <SearchField
            placeholder="Search components..."
            value={searchVal}
            onChange={setSearchVal}
            onClear={() => setSearchVal('')}
          />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>TextArea</div>
        <div className="showcase-grid-2">
          <div className="form-group">
            <label className="form-label">Default</label>
            <div className="form-textarea-wrapper">
              <textarea className="form-textarea" placeholder="Enter a description..." rows={3} />
              <div className="form-textarea-bottom">
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>0 / 500</span>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Error</label>
            <div className="form-textarea-wrapper error">
              <textarea className="form-textarea" defaultValue="Something went wrong" rows={3} />
            </div>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>ComboBox</div>
        <div style={{ maxWidth: 320 }}>
          <div className="combobox">
            <label className="form-label">Select an option</label>
            <div className="combobox-field">
              <div className="combobox-input-area">
                <input className="combobox-input" type="text" placeholder="Type to search..." />
              </div>
              <div className="combobox-separator" />
              <button className="combobox-trigger" aria-label="Toggle dropdown">
                <span className="combobox-chevron"><IconChevron size={16} /></span>
              </button>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 11. CHECKBOX & RADIO                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Checkbox & Radio" desc="Selection controls with validation and group layouts.">
        <div className="showcase-row-start">
          <div className="showcase-col">
            <div className="showcase-label">Checkbox</div>
            <label className="checkbox">
              <input type="checkbox" className="checkbox-input" checked={check1} onChange={() => setCheck1(!check1)} />
              <span className="checkbox-box">{check1 && <IconCheck />}</span>
              <span className="checkbox-label"><span className="checkbox-label-text">Unchecked / Checked</span></span>
            </label>
            <label className="checkbox">
              <input type="checkbox" className="checkbox-input" checked={check2} onChange={() => setCheck2(!check2)} />
              <span className="checkbox-box">{check2 && <IconCheck />}</span>
              <span className="checkbox-label">
                <span className="checkbox-label-text">With helper</span>
                <span className="checkbox-helper">Additional description</span>
              </span>
            </label>
            <label className="checkbox">
              <input type="checkbox" className="checkbox-input" ref={(el) => { if (el) el.indeterminate = true }} readOnly />
              <span className="checkbox-box"><IconMinus /></span>
              <span className="checkbox-label"><span className="checkbox-label-text">Indeterminate</span></span>
            </label>
            <label className="checkbox disabled">
              <input type="checkbox" className="checkbox-input" disabled />
              <span className="checkbox-box" />
              <span className="checkbox-label"><span className="checkbox-label-text">Disabled</span></span>
            </label>
          </div>

          <div className="showcase-col">
            <div className="showcase-label">Radio</div>
            <fieldset className="radio-group">
              <div className="radio-group-list">
                {['opt1', 'opt2', 'opt3'].map((val, i) => (
                  <label key={val} className="radio">
                    <input type="radio" className="radio-input" name="demo-radio" value={val} checked={radioVal === val} onChange={() => setRadioVal(val)} />
                    <span className="radio-circle" />
                    <span className="radio-label"><span className="radio-label-text">Option {i + 1}</span></span>
                  </label>
                ))}
                <label className="radio disabled">
                  <input type="radio" className="radio-input" name="demo-radio" value="disabled" disabled />
                  <span className="radio-circle" />
                  <span className="radio-label"><span className="radio-label-text">Disabled</span></span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 12. TOGGLE                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Toggle" desc="Standard and compact toggle switches with labels.">
        <div className="showcase-row-start">
          <Toggle
            checked={toggleA}
            onChange={setToggleA}
            label="Notifications"
            helperText={toggleA ? 'Enabled' : 'Disabled'}
          />
          <Toggle
            checked={toggleB}
            onChange={setToggleB}
            label="Auto-save"
          />
          <Toggle
            checked={compactToggle}
            onChange={setCompactToggle}
            label="Compact"
            size="compact"
          />
          <Toggle
            disabled
            label="Disabled"
          />
          <Toggle
            checked
            disabled
            label="Disabled On"
          />
          <Toggle
            readOnly
            label="Read-only"
          />
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 12b. TIME PICKER                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Time Picker" desc="Spinbutton-based time input with 12/24hr clock, dropdown list, and validation states.">
        <div className="showcase-row-start" style={{ alignItems: 'flex-start', gap: 32 }}>
          <TimePicker
            label="Start time"
            required
            helperText="Helper text"
            value={timeVal}
            onChange={setTimeVal}
          />
          <TimePicker
            label="End time"
            value={timeVal2}
            onChange={setTimeVal2}
          />
          <TimePicker
            label="Error state"
            required
            validation="error"
            helperText="Please enter a valid time"
          />
          <TimePicker
            label="Disabled"
            disabled
          />
          <TimePicker
            label="Read-only"
            readOnly
            value={{ hour: 9, minute: 0 }}
          />
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 12c. PASSWORD INPUT                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Password Input" desc="Password field with show/hide toggle, validation states, and helper text.">
        <div className="showcase-row-start" style={{ alignItems: 'flex-start', gap: 32 }}>
          <div style={{ width: 240 }}>
            <PasswordInput
              label="Password"
              placeholder="Placeholder text"
              helperText="Helper text"
              value={password}
              onChange={setPassword}
            />
          </div>
          <div style={{ width: 240 }}>
            <PasswordInput
              label="Password"
              placeholder="Enter password"
              helperText="Helper text"
              value={passwordFilled}
              onChange={setPasswordFilled}
            />
          </div>
          <div style={{ width: 240 }}>
            <PasswordInput
              label="Password"
              placeholder="Placeholder text"
              validation="error"
              helperText="Helper text"
            />
          </div>
          <div style={{ width: 240 }}>
            <PasswordInput
              label="Password"
              validation="success"
              helperText="Helper text"
              value="strongP@ss1"
            />
          </div>
          <div style={{ width: 240 }}>
            <PasswordInput
              label="Password"
              helperText="Helper text"
              disabled
            />
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 12d. DATE PICKER                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Date Picker" desc="Calendar-based date input with month navigation, validation, and disabled/read-only states.">
        <div className="showcase-row-start" style={{ alignItems: 'flex-start', gap: 32 }}>
          <DatePicker
            label="Start date"
            required
            helperText="Helper text"
            value={dateVal}
            onChange={setDateVal}
          />
          <DatePicker
            label="End date"
            value={dateVal2}
            onChange={setDateVal2}
          />
          <DatePicker
            label="Error state"
            validation="error"
            helperText="Please select a date"
          />
          <DatePicker
            label="Disabled"
            disabled
          />
          <DatePicker
            label="Read-only"
            readOnly
            value={new Date()}
          />
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 13. DROPDOWN & MENU                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Dropdown & Menu" desc="Dropdown triggers with menu overlay, items, sections, and dividers.">
        <div className="showcase-row-start">
          <div ref={dropdownRef} style={{ position: 'relative', minWidth: 180 }}>
            <button
              type="button"
              className={`dropdown-trigger${dropdownOpen ? ' open' : ''}`}
              onClick={() => setDropdownOpen((p) => !p)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              <span className="dropdown-trigger-value">Select option</span>
              <svg className="dropdown-trigger-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu" role="listbox" style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50 }}>
                <button type="button" role="option" aria-selected={true} className="menu-item active">
                  <span className="menu-item-leading"><span className="menu-item-label">Option One</span></span>
                  <span className="menu-item-check"><IconCheck size={14} /></span>
                </button>
                <button type="button" role="option" className="menu-item">
                  <span className="menu-item-leading"><span className="menu-item-label">Option Two</span></span>
                </button>
                <div className="menu-divider" />
                <button type="button" role="option" className="menu-item">
                  <span className="menu-item-leading"><span className="menu-item-label">Option Three</span></span>
                </button>
              </div>
            )}
          </div>

          <div className="showcase-col">
            <div className="showcase-label">Menu Overlay (Static)</div>
            <div className="menu-overlay" style={{ position: 'relative', zIndex: 'auto', width: 240 }}>
              <div className="menu-header">Section Title</div>
              <button className="menu-item active">
                <span className="menu-item-leading"><span className="menu-item-label">Active Item</span></span>
                <span className="menu-item-check"><IconCheck size={14} /></span>
              </button>
              <button className="menu-item">
                <span className="menu-item-leading"><span className="menu-item-label">Regular Item</span></span>
              </button>
              <div className="menu-divider" />
              <button className="menu-item menu-item-danger">
                <span className="menu-item-leading"><span className="menu-item-label">Danger Item</span></span>
              </button>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 14. MODAL DIALOG                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Modal Dialog" desc="Overlay dialog with header, body, footer, and size variants.">
        <div className="showcase-row">
          <Button variant="secondary" size={32} onClick={() => setModalOpen(true)}>Open Modal</Button>
        </div>
        {modalOpen && (
          <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}>
            <div className="modal modal--md">
              <div className="modal-header">
                <div className="modal-header-copy">
                  <h3 className="modal-title">Dialog Title</h3>
                  <p className="modal-description">This is a modal dialog from the component library.</p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
                <IconX size={14} />
              </button>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: '20px' }}>
                  Modal body content goes here. This dialog supports small, medium, and large widths via .modal--sm, .modal--md, and .modal--lg classes.
                </p>
              </div>
              <div className="modal-footer">
                <Button variant="tertiary" size={32} onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button variant="primary" size={32} onClick={() => setModalOpen(false)}>Confirm</Button>
              </div>
            </div>
          </div>
        )}
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  ANNOUNCEMENT DIALOG                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Announcement Dialog" desc="Promotional dialog with illustration or custom image, title, description, link, and action buttons.">
        <div className="showcase-label">Illustration Variant</div>
        <div style={{ marginBottom: 24 }}>
          <AnnouncementDialog
            title="What's New in v10"
            description="Discover the latest features and improvements we've built to help you work smarter and collaborate better with your team."
            imageContent={<Illustration name="whats-new" size="oneninetwo" variant="empty-primary" width={200} height={200} />}
            imageBg="var(--mds-color-theme-background-alert-theme-normal, #1a1a2e)"
            linkText="Learn more"
            linkHref="#"
            primaryLabel="Get Started"
            secondaryLabel="Maybe Later"
            onPrimary={() => {}}
            onSecondary={() => {}}
            onClose={() => {}}
          />
        </div>

        <div className="showcase-label">Custom Image Variant</div>
        <div style={{ marginBottom: 24 }}>
          <AnnouncementDialog
            title="Try AI Agent Studio"
            description="Build, test, and deploy conversational AI agents with an intuitive visual builder. No coding required."
            imageContent={<Illustration name="collaboration-build" size="threetwozero" variant="onboarding-primary" width={200} height={200} />}
            imageBg="var(--mds-color-theme-background-alert-purple-normal, #3b1840)"
            linkText="View documentation"
            linkHref="#"
            primaryLabel="Start Building"
            secondaryLabel="Dismiss"
            onPrimary={() => {}}
            onSecondary={() => {}}
            onClose={() => {}}
          />
        </div>

        <div className="showcase-label">Minimal — No Link</div>
        <div>
          <AnnouncementDialog
            title="Welcome Back"
            description="Your workspace is ready. Pick up right where you left off."
            imageContent={<Illustration name="journey-start" size="threetwozero" variant="onboarding-primary" width={200} height={200} />}
            imageBg="var(--mds-color-theme-background-solid-tertiary-normal, #262626)"
            primaryLabel="Continue"
            onPrimary={() => {}}
            onClose={() => {}}
          />
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 15. BANNERS                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Banners" desc="Inline banner messages with icon, title, subtitle, and actions.">
        <div className="showcase-col" style={{ gap: 12 }}>
          <div className="banner banner-info">
            <span className="banner-icon"><IconInfo size={20} /></span>
            <div className="banner-content">
              <div className="banner-text">
                <div className="banner-title">Information</div>
                <div className="banner-subtitle">This is a helpful informational message.</div>
              </div>
            </div>
            <div className="banner-actions">
              <button className="banner-action-outline">Action</button>
            </div>
            <button className="banner-dismiss" aria-label="Dismiss"><IconX size={14} /></button>
          </div>

          <div className="banner banner-warning">
            <span className="banner-icon"><IconWarning size={20} /></span>
            <div className="banner-content">
              <div className="banner-text">
                <div className="banner-title">Warning</div>
                <div className="banner-subtitle">This action may have unintended side effects.</div>
              </div>
            </div>
          </div>

          <div className="banner banner-success">
            <span className="banner-icon"><IconCheckCircle size={20} /></span>
            <div className="banner-content">
              <div className="banner-text">
                <div className="banner-title">Success</div>
                <div className="banner-subtitle">Your changes have been saved successfully.</div>
              </div>
            </div>
          </div>

          <div className="banner banner-error">
            <span className="banner-icon"><IconAlertCircle size={20} /></span>
            <div className="banner-content">
              <div className="banner-text">
                <div className="banner-title">Error</div>
                <div className="banner-subtitle">Something went wrong. Please try again.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Promotional Banner</div>
        <div className="promo-banner">
          <div className="promo-banner-body">
            <div className="promo-banner-slot" style={{ width: 80, height: 80, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Illustration name="rocket-avatar" size="onetwozero" variant="empty-primary" width={72} height={72} />
            </div>
            <div className="promo-banner-content">
              <div className="promo-banner-text">
                <div className="promo-banner-title">Upgrade to Pro</div>
                <div className="promo-banner-subtitle">Get access to advanced features and priority support.</div>
              </div>
              <div className="promo-banner-actions">
                <Button variant="primary" size={32}>Upgrade Now</Button>
                <Button variant="tertiary" size={32}>Learn More</Button>
              </div>
            </div>
          </div>
          <div className="promo-banner-dismiss">
            <button className="banner-dismiss" aria-label="Dismiss"><IconX size={14} /></button>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 16. TOAST                                             */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Toast" desc="Notification toasts with icon variants and action slots.">
        <div className="showcase-grid-2">
          <div className="toast" style={{ position: 'relative', animation: 'none', width: '100%' }}>
            <div className="toast-content">
              <span className="toast-icon toast-icon-success"><IconCheckCircle size={24} /></span>
              <div className="toast-body">
                <div className="toast-header">Success</div>
                <div className="toast-message">Changes saved successfully.</div>
              </div>
              <button className="toast-close" aria-label="Close"><IconX size={10} /></button>
            </div>
          </div>

          <div className="toast" style={{ position: 'relative', animation: 'none', width: '100%' }}>
            <div className="toast-content">
              <span className="toast-icon toast-icon-error"><IconAlertCircle size={24} /></span>
              <div className="toast-body">
                <div className="toast-header">Error</div>
                <div className="toast-message">Failed to save. <a href="#" onClick={(e) => e.preventDefault()}>Retry</a></div>
              </div>
              <button className="toast-close" aria-label="Close"><IconX size={10} /></button>
            </div>
            <div className="toast-actions">
              <Button variant="tertiary" size={28}>Dismiss</Button>
              <Button variant="secondary" size={28}>Retry</Button>
            </div>
          </div>

          <div className="toast" style={{ position: 'relative', animation: 'none', width: '100%' }}>
            <div className="toast-content">
              <span className="toast-icon toast-icon-warning"><IconWarning size={24} /></span>
              <div className="toast-body">
                <div className="toast-header">Warning</div>
                <div className="toast-message">Approaching usage limit.</div>
              </div>
              <button className="toast-close" aria-label="Close"><IconX size={10} /></button>
            </div>
          </div>

          <div className="toast" style={{ position: 'relative', animation: 'none', width: '100%' }}>
            <div className="toast-content">
              <span className="toast-icon toast-icon-info"><IconInfo size={24} /></span>
              <div className="toast-body">
                <div className="toast-header">Info</div>
                <div className="toast-message">New features are available.</div>
              </div>
              <button className="toast-close" aria-label="Close"><IconX size={10} /></button>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 17. TOOLTIP                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Tooltip" desc="Contextual tooltips with placement variants and interactive toggle-tip.">
        <div className="showcase-label">Placements</div>
        <div className="showcase-row" style={{ gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {['bottom', 'top', 'right', 'left'].map((p) => (
            <div key={p} className="showcase-col" style={{ alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>{p}</span>
              <div className="tooltip-bubble" data-placement={p} style={{ position: 'relative', animation: 'none', pointerEvents: 'auto' }}>
                <div className="tooltip-body"><span className="tooltip-text">Tooltip content</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="showcase-label">With Action Button</div>
        <div className="tooltip-bubble" data-placement="bottom" style={{ position: 'relative', animation: 'none', pointerEvents: 'auto', maxWidth: 300 }}>
          <div className="tooltip-body">
            <span className="tooltip-text">Click the button below to learn more about this feature.</span>
            <button className="tooltip-action-btn">Learn more</button>
          </div>
        </div>

        <div className="showcase-label">Toggle Tip (with close)</div>
        <div className="tooltip-bubble tooltip-interactive" data-placement="bottom" style={{ position: 'relative', animation: 'none', pointerEvents: 'auto', maxWidth: 320 }}>
          <button className="toggletip-close" aria-label="Close"><IconX size={12} /></button>
          <div className="toggletip-content">
            <span className="tooltip-text">This is a toggle tip with a close button and an action link.</span>
            <button className="toggletip-link">View documentation →</button>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 18. SPINNER                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Spinner" desc="Loading spinner in small, medium, and large sizes.">
        <div className="showcase-row">
          <div className="showcase-col" style={{ alignItems: 'center' }}>
            <div className="showcase-label">Small</div>
            <span className="spinner spinner-sm">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeDasharray="40 20" /></svg>
            </span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center' }}>
            <div className="showcase-label">Medium</div>
            <span className="spinner spinner-md">
              <svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" strokeDasharray="80 40" /></svg>
            </span>
          </div>
          <div className="showcase-col" style={{ alignItems: 'center' }}>
            <div className="showcase-label">Large</div>
            <span className="spinner spinner-lg">
              <svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" strokeDasharray="160 80" /></svg>
            </span>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 19. SLIDER                                            */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Slider" desc="Interactive range slider with track, thumb, and labels.">
        <div style={{ maxWidth: 400 }}>
          <div className="slider">
            <span className="slider-label">Volume: {sliderVal}%</span>
            <div className="slider-track-container" ref={sliderRef} onMouseDown={handleSliderDown}>
              <div className="slider-track">
                <div className="slider-track-fill" style={{ width: `${sliderVal}%` }} />
              </div>
              <div className="slider-thumb" style={{ left: `${sliderVal}%` }} tabIndex={0} role="slider" aria-valuenow={sliderVal} aria-valuemin={0} aria-valuemax={100} />
            </div>
            <div className="slider-value-labels">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 20. PROGRESS BAR                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Progress Bar" desc="Determinate progress bar with label, percentage, and status variants.">
        <div className="showcase-col" style={{ maxWidth: 480, gap: 20 }}>
          <div className="progress-bar">
            <div className="progress-bar__header">
              <span className="progress-bar__label">Uploading files...</span>
              <span className="progress-bar__percent">68%</span>
            </div>
            <div className="progress-bar__track">
              <div className="progress-bar__fill" style={{ width: '68%' }} />
            </div>
          </div>

          <div className="progress-bar progress-bar--success">
            <div className="progress-bar__header">
              <span className="progress-bar__label">Complete</span>
              <span className="progress-bar__percent">100%</span>
            </div>
            <div className="progress-bar__track">
              <div className="progress-bar__fill" style={{ width: '100%' }} />
            </div>
            <div className="progress-bar__helper">
              <span className="progress-bar__helper-icon"><IconCheckCircle size={14} /></span>
              <span className="progress-bar__helper-text">All files uploaded successfully.</span>
            </div>
          </div>

          <div className="progress-bar progress-bar--failed">
            <div className="progress-bar__header">
              <span className="progress-bar__label">Upload failed</span>
              <span className="progress-bar__percent">43%</span>
            </div>
            <div className="progress-bar__track">
              <div className="progress-bar__fill" style={{ width: '43%' }} />
            </div>
            <div className="progress-bar__helper">
              <span className="progress-bar__helper-icon"><IconAlertCircle size={14} /></span>
              <span className="progress-bar__helper-text">Connection lost. Please retry.</span>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 21. PAGINATION                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Pagination" desc="Page navigation with capacity controls, range display, and page buttons.">
        <div className="pagination">
          <div className="pagination-capacity">
            <span className="pagination-capacity-label">Rows per page:</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>10</span>
          </div>
          <span className="pagination-range">1–10 of 96</span>
          <div className="pagination-nav">
            <div className="pagination-nav-cluster">
              <button className="pagination-icon-btn" disabled aria-label="First page"><IconChevron direction="left" /><IconChevron direction="left" /></button>
              <button className="pagination-icon-btn" disabled aria-label="Previous page"><IconChevron direction="left" /></button>
            </div>
            <div className="pagination-nav-cluster">
              {[1, 2, 3, 4, 5].map((p) => (
                <button key={p} className={`pagination-icon-btn${p === 1 ? ' active' : ''}`} style={p === 1 ? { background: 'var(--mds-color-theme-button-secondary-active-normal)', fontWeight: 700 } : undefined}>{p}</button>
              ))}
            </div>
            <div className="pagination-nav-cluster">
              <button className="pagination-icon-btn" aria-label="Next page"><IconChevron direction="right" /></button>
              <button className="pagination-icon-btn" aria-label="Last page"><IconChevron direction="right" /><IconChevron direction="right" /></button>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 22. LIST ITEMS                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="List Items" desc="Versatile list item with leading, body, and trailing slots.">
        <div className="showcase-box" style={{ maxWidth: 400, padding: 0 }}>
          <div className="list-container">
            <div className="list-header">
              <div className="list-header-content">
                <span className="list-header-label">Team Members</span>
              </div>
              <div className="list-header-trailing">
                <span className="badge badge-info">4</span>
              </div>
            </div>

            <div className="listitem">
              <div className="listitem-content">
                <div className="listitem-leading">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-primary)', fontSize: 14, fontWeight: 600 }}>A</div>
                </div>
                <div className="listitem-body">
                  <span className="listitem-primary">Alice Johnson</span>
                  <span className="listitem-secondary">Engineering</span>
                </div>
                <div className="listitem-trailing">
                  <div className="listitem-trailing-copy">
                    <span className="listitem-trailing-header">Admin</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="listitem active">
              <div className="listitem-content">
                <div className="listitem-leading">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>B</div>
                </div>
                <div className="listitem-body">
                  <span className="listitem-primary">Bob Smith</span>
                  <span className="listitem-secondary">Design <span className="listitem-separator" /> Lead</span>
                </div>
                <div className="listitem-trailing">
                  <div className="listitem-trailing-copy">
                    <span className="listitem-trailing-header">Editor</span>
                    <span className="listitem-trailing-subline">Online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="listitem">
              <div className="listitem-content">
                <div className="listitem-leading">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>C</div>
                </div>
                <div className="listitem-body">
                  <span className="listitem-primary">Carol Lee</span>
                  <span className="listitem-secondary">Marketing</span>
                </div>
              </div>
            </div>

            <div className="listitem disabled">
              <div className="listitem-content">
                <div className="listitem-leading">
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>D</div>
                </div>
                <div className="listitem-body">
                  <span className="listitem-primary">Dave Kim</span>
                  <span className="listitem-secondary">Deactivated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 23. ACCORDION                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Accordion" desc="Expandable content panels with default, stacked, and borderless variants. Supports single or multi-expand.">
        <div className="showcase-label">Single — Stacked Group</div>
        <AccordionGroup variant="stack" defaultExpanded={['faq1']} style={{ maxWidth: 544 }}>
          <Accordion id="faq1" heading="What is this design system?">
            A comprehensive collection of reusable components built on the Momentum Design System, using CSS custom properties for theming.
          </Accordion>
          <Accordion id="faq2" heading="How do I customize colors?">
            Edit the color tokens in tokens.css. The light and dark themes are controlled via the data-theme attribute on the HTML element.
          </Accordion>
          <Accordion id="faq3" heading="Can I add new components?">
            Yes! Follow the existing patterns in components.css and create new CSS classes with the appropriate token references.
          </Accordion>
        </AccordionGroup>

        <div className="showcase-label" style={{ marginTop: 24 }}>Multi — Stacked Group</div>
        <AccordionGroup variant="stack" multiple defaultExpanded={['m1', 'm2']} style={{ maxWidth: 544 }}>
          <Accordion id="m1" heading="First section">
            Multiple panels can be open at the same time in a multi-expand group.
          </Accordion>
          <Accordion id="m2" heading="Second section">
            This section is also expanded by default alongside the first.
          </Accordion>
          <Accordion id="m3" heading="Third section">
            Click to expand this panel independently.
          </Accordion>
        </AccordionGroup>

        <div className="showcase-label" style={{ marginTop: 24 }}>Borderless</div>
        <AccordionGroup variant="borderless" defaultExpanded={['b1']} style={{ maxWidth: 544 }}>
          <Accordion id="b1" heading="Borderless expanded">
            Borderless variant removes the outer border and uses only the content divider.
          </Accordion>
          <Accordion id="b2" heading="Borderless collapsed">
            Second borderless panel content.
          </Accordion>
        </AccordionGroup>

        <div className="showcase-label" style={{ marginTop: 24 }}>Large Size</div>
        <AccordionGroup variant="stack" defaultExpanded={['lg1']} style={{ maxWidth: 544 }}>
          <Accordion id="lg1" heading="Large accordion item" size="large">
            The large variant uses 24px padding on both the header and content area.
          </Accordion>
          <Accordion id="lg2" heading="Another large item" size="large">
            Additional content for the large-size variant.
          </Accordion>
        </AccordionGroup>

        <div className="showcase-label" style={{ marginTop: 24 }}>States</div>
        <div style={{ maxWidth: 544, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Accordion heading="Normal" defaultExpanded>Normal expanded accordion item.</Accordion>
          <Accordion heading="Disabled" disabled>This panel cannot be toggled.</Accordion>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* SIDE NAVIGATION                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Side Navigation" desc="Vertical navigation with icon+label items, sections, gradient dividers, active marker, badge counters, child arrows, collapsed mode, and customer logo.">
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* ── Expanded ── */}
          <div style={{ width: 232, height: 600, overflow: 'hidden' }}>
            <SideNav>
              <SideNav.Upper>
                <SideNav.Section>
                  <SideNav.Item icon="home-bold" label="Home" active />
                  <SideNav.Item icon="contact-card-bold" label="Contacts" />
                  <SideNav.Item icon="chat-bold" label="Messaging" badge={3} hasChildren>
                    <SideNav.SubMenuItem icon="chat-group-bold" label="Team Chat" />
                    <SideNav.SubMenuItem icon="chat-bold" label="Direct Messages" />
                    <SideNav.SubMenuItem icon="mention-bold" label="Mentions" />
                    <SideNav.SubMenuItem icon="flag-bold" label="Flagged" />
                  </SideNav.Item>
                </SideNav.Section>
                <SideNav.Section header="Workspace">
                  <SideNav.Item icon="document-bold" label="Documents" />
                  <SideNav.Item icon="calendar-month-bold" label="Calendar" hasChildren>
                    <SideNav.SubMenuItem icon="calendar-month-bold" label="My Calendar" />
                    <SideNav.SubMenuItem icon="people-bold" label="Team Calendar" />
                    <SideNav.SubMenuItem icon="recurring-bold" label="Recurring Events" />
                  </SideNav.Item>
                  <SideNav.Item icon="custom-task-bold" label="Tasks" />
                  <SideNav.Item icon="people-bold" label="Teams" />
                </SideNav.Section>
                <SideNav.Section header="Admin">
                  <SideNav.Item icon="admin-bold" label="Settings" hasChildren>
                    <SideNav.SubMenuItem icon="settings-bold" label="General" />
                    <SideNav.SubMenuItem icon="secure-call-lock-bold" label="Security" />
                    <SideNav.SubMenuItem icon="people-bold" label="Users & Roles" />
                    <SideNav.SubMenuItem icon="alert-bold" label="Notifications" />
                  </SideNav.Item>
                  <SideNav.Item icon="dashboard-bold" label="Analytics" />
                </SideNav.Section>
              </SideNav.Upper>
              <SideNav.Footer>
                <SideNav.Item icon="help-circle-bold" label="Help" />
                <SideNav.Item icon="settings-bold" label="Preferences" />
                <SideNav.CustomerLogo name="Acme Corp" />
              </SideNav.Footer>
            </SideNav>
          </div>

          {/* ── Collapsed ── */}
          <div style={{ width: 72, height: 600, overflow: 'hidden' }}>
            <SideNav collapsed>
              <SideNav.Upper>
                <SideNav.Section>
                  <SideNav.Item icon="home-bold" label="Home" active />
                  <SideNav.Item icon="contact-card-bold" label="Contacts" />
                  <SideNav.Item icon="chat-bold" label="Messaging" />
                </SideNav.Section>
                <SideNav.Section header="Workspace">
                  <SideNav.Item icon="document-bold" label="Documents" />
                  <SideNav.Item icon="calendar-month-bold" label="Calendar" />
                  <SideNav.Item icon="custom-task-bold" label="Tasks" />
                </SideNav.Section>
              </SideNav.Upper>
              <SideNav.Footer>
                <SideNav.Item icon="help-circle-bold" label="Help" />
                <SideNav.Item icon="settings-bold" label="Preferences" />
                <SideNav.CustomerLogo name="Acme Corp" />
              </SideNav.Footer>
            </SideNav>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>States</div>
        <div style={{ width: 280 }}>
          <SideNav>
            <SideNav.Section>
              <SideNav.Item icon="home-bold" label="Active" active />
              <SideNav.Item icon="placeholder-bold" label="Rest" />
              <SideNav.Item icon="placeholder-bold" label="With badge" badge={5} hasChildren>
                <SideNav.SubMenuItem icon="placeholder-bold" label="Sub item 1" />
                <SideNav.SubMenuItem icon="placeholder-bold" label="Sub item 2" />
                <SideNav.SubMenuItem icon="placeholder-bold" label="Sub item 3" />
              </SideNav.Item>
              <SideNav.Item icon="placeholder-bold" label="Disabled" disabled />
            </SideNav.Section>
          </SideNav>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* TOOLBAR / BUTTON GROUP                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Toolbar / Button Group" desc="Grouped icon and pill buttons in compact (24px) and standard (32px) pill containers. Supports horizontal, vertical, and split-pill layouts.">
        <div className="showcase-label">Compact — Headings (H1 H2 H3)</div>
        <Toolbar.ButtonGroup size="compact">
          <Toolbar.IconButton icon="heading-one-bold" label="Heading 1" />
          <Toolbar.IconButton icon="heading-two-bold" label="Heading 2" />
          <Toolbar.IconButton icon="heading-three-bold" label="Heading 3" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Compact — Messaging Toolbar</div>
        <Toolbar.ButtonGroup size="compact">
          <Toolbar.IconButton icon="reply-bold" label="Reply" />
          <Toolbar.IconButton icon="reactions-bold" label="Reactions" />
          <Toolbar.IconButton icon="alert-active-bold" label="Alert" />
          <Toolbar.IconButton icon="forward-message-bold" label="Forward" />
          <Toolbar.IconButton icon="more-bold" label="More" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Compact — Bold / Italic / Underline</div>
        <Toolbar.ButtonGroup size="compact">
          <Toolbar.IconButton icon="bold-bold" label="Bold" />
          <Toolbar.IconButton icon="italic-bold" label="Italic" />
          <Toolbar.IconButton icon="underline-bold" label="Underline" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Standard — Zoom In / Zoom Out</div>
        <Toolbar.ButtonGroup size="standard">
          <Toolbar.IconButton icon="zoom-in-bold" label="Zoom In" />
          <Toolbar.IconButton icon="zoom-out-bold" label="Zoom Out" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Standard — Arrow Up / Arrow Down</div>
        <Toolbar.ButtonGroup size="standard">
          <Toolbar.IconButton icon="arrow-up-bold" label="Arrow Up" />
          <Toolbar.IconButton icon="arrow-down-bold" label="Arrow Down" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Split Pill — Raise Hand</div>
        <Toolbar.ButtonGroup size="standard">
          <Toolbar.PillButton icon="raise-hand-bold" label="Raise">Raise</Toolbar.PillButton>
          <Toolbar.IconButton icon="reactions-bold" label="More options" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Split Pill — Unmute</div>
        <Toolbar.ButtonGroup size="standard">
          <Toolbar.PillButton icon="microphone-muted-bold" label="Unmute">Unmute</Toolbar.PillButton>
          <Toolbar.IconButton icon="arrow-down-bold" label="Audio options" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Split Pill — Stop Video</div>
        <Toolbar.ButtonGroup size="standard">
          <Toolbar.PillButton icon="video-bold" label="Stop Video">Stop Video</Toolbar.PillButton>
          <Toolbar.IconButton icon="arrow-down-bold" label="Video options" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Split Icon — Unmute + Dropdown</div>
        <div className="showcase-row" style={{ gap: 16 }}>
          <Toolbar.ButtonGroup size="standard">
            <Toolbar.IconButton icon="closed-captions-bold" label="Closed Captions" />
            <Toolbar.IconButton icon="arrow-down-bold" label="Caption options" />
          </Toolbar.ButtonGroup>
          <Toolbar.ButtonGroup size="standard">
            <Toolbar.IconButton icon="microphone-muted-bold" label="Unmute" />
            <Toolbar.IconButton icon="arrow-down-bold" label="Audio options" />
          </Toolbar.ButtonGroup>
          <Toolbar.ButtonGroup size="standard">
            <Toolbar.IconButton icon="video-bold" label="Stop Video" />
            <Toolbar.IconButton icon="arrow-down-bold" label="Video options" />
          </Toolbar.ButtonGroup>
        </div>

        <div className="showcase-label" style={{ marginTop: 20 }}>Vertical — Zoom In / Zoom Out</div>
        <Toolbar.ButtonGroup size="standard" orientation="vertical">
          <Toolbar.IconButton icon="zoom-in-bold" label="Zoom In" />
          <Toolbar.IconButton icon="zoom-out-bold" label="Zoom Out" />
        </Toolbar.ButtonGroup>

        <div className="showcase-label" style={{ marginTop: 20 }}>Selected State</div>
        <div className="showcase-row" style={{ gap: 16 }}>
          <Toolbar.ButtonGroup size="compact">
            <Toolbar.IconButton icon="bold-bold" label="Bold" selected />
            <Toolbar.IconButton icon="italic-bold" label="Italic" />
            <Toolbar.IconButton icon="underline-bold" label="Underline" />
          </Toolbar.ButtonGroup>
        </div>

        <div className="showcase-label" style={{ marginTop: 20 }}>Disabled State</div>
        <div className="showcase-row" style={{ gap: 16 }}>
          <Toolbar.ButtonGroup size="compact">
            <Toolbar.IconButton icon="bold-bold" label="Bold" disabled />
            <Toolbar.IconButton icon="italic-bold" label="Italic" disabled />
            <Toolbar.IconButton icon="underline-bold" label="Underline" disabled />
          </Toolbar.ButtonGroup>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 24. EMPTY STATE                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Empty State" desc="Placeholder UI for empty lists, search results, or initial states.">
        <div className="showcase-box" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="empty-state">
            <div className="empty-state__graphic empty-state__graphic--md">
              <Illustration name="flashlight-search" size="oneninetwo" variant="empty-primary" width={160} height={128} />
            </div>
            <div className="empty-state__text">
              <h3 className="empty-state__title">No results found</h3>
              <p className="empty-state__description">Try adjusting your search or filters to find what you&apos;re looking for.</p>
            </div>
            <div className="empty-state__actions">
              <Button variant="primary" size={32}>Create New</Button>
              <Button variant="tertiary" size={32}>Reset Filters</Button>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  ILLUSTRATIONS                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Illustrations" desc="Momentum Design illustrations for empty states, onboarding, errors, and success moments. Lazy-loaded from @momentum-design/illustrations.">
        <div className="showcase-label">Size: 120 — Variants</div>
        <div className="showcase-row" style={{ alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="box-open" size="onetwozero" variant="empty-primary" width={120} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>empty-primary</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="box-open" size="onetwozero" variant="empty-secondary" width={120} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>empty-secondary</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="box-open" size="onetwozero" variant="error" width={120} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>error</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="box-open" size="onetwozero" variant="success" width={120} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>success</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="box-open" size="onetwozero" variant="default" width={120} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>default</div>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>Size: 192 — Search &amp; Filter</div>
        <div className="showcase-row" style={{ alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="flashlight-search" size="oneninetwo" variant="empty-primary" width={160} height={128} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>flashlight-search</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="desert-open-results" size="oneninetwo" variant="empty-primary" width={160} height={128} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>desert-open-results</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="bullseye-filter" size="oneninetwo" variant="empty-primary" width={160} height={128} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>bullseye-filter</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="whats-new" size="oneninetwo" variant="empty-primary" width={160} height={128} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>whats-new</div>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>Size: 320 — Journey &amp; Onboarding</div>
        <div className="showcase-row" style={{ alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="journey-start" size="threetwozero" variant="onboarding-primary" width={200} height={160} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>journey-start</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="journey-complete" size="threetwozero" variant="success" width={200} height={160} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>journey-complete</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="journey-failed" size="threetwozero" variant="error" width={200} height={160} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>journey-failed</div>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>Size: 320 — Collaboration</div>
        <div className="showcase-row" style={{ alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="collaboration-build" size="threetwozero" variant="empty-primary" width={200} height={160} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>collaboration-build</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="collaboration-anywhere" size="threetwozero" variant="empty-primary" width={200} height={160} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>collaboration-anywhere</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="learning-education" size="threetwozero" variant="onboarding-primary" width={200} height={160} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>learning-education</div>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>Avatars (120)</div>
        <div className="showcase-row" style={{ alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="rocket-avatar" size="onetwozero" variant="empty-primary" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>rocket-avatar</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="astronaut-avatar" size="onetwozero" variant="empty-primary" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>astronaut-avatar</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="butterfly-avatar" size="onetwozero" variant="empty-primary" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>butterfly-avatar</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="cat-avatar" size="onetwozero" variant="empty-primary" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>cat-avatar</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="dog-avatar" size="onetwozero" variant="empty-primary" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>dog-avatar</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="cup-avatar" size="onetwozero" variant="empty-primary" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>cup-avatar</div>
          </div>
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>Status &amp; Feedback (120)</div>
        <div className="showcase-row" style={{ alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="warning" size="onetwozero" variant="error" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>warning / error</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="cloud-services" size="onetwozero" variant="empty-primary" width={96} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>cloud-services</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="flag-success" size="oneninetwo" variant="success" width={120} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>flag-success</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Illustration name="meet" size="oneninetwo" variant="empty-primary" width={120} height={96} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>meet</div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 25. TEXT LINK                                         */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Text Link" desc="Standalone and inline text links in multiple sizes.">
        <div className="showcase-row">
          <a href="#" className="text-link text-link--standalone text-link--lg" onClick={(e) => e.preventDefault()}>Large Link</a>
          <a href="#" className="text-link text-link--standalone text-link--md" onClick={(e) => e.preventDefault()}>Medium Link</a>
          <a href="#" className="text-link text-link--standalone text-link--sm" onClick={(e) => e.preventDefault()}>Small Link</a>
          <a href="#" className="text-link text-link--standalone text-link--disabled" onClick={(e) => e.preventDefault()}>Disabled</a>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: '20px', marginTop: 8 }}>
          Inline links work within text, like <a href="#" className="text-link text-link--inline" onClick={(e) => e.preventDefault()}>this inline link</a> does here.
        </p>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 26. WIZARD / STEPPER                                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Wizard / Stepper" desc="Horizontal step progress indicator with completed, active, and pending states.">
        <div className="wizard-progress" style={{ padding: 0, justifyContent: 'flex-start' }}>
          <div className="wizard-step completed">
            <span className="wizard-step-number"><IconCheck size={14} /></span>
            <span className="wizard-step-label">Setup</span>
          </div>
          <div className="wizard-step-line completed" />
          <div className="wizard-step active">
            <span className="wizard-step-number">2</span>
            <span className="wizard-step-label">Configure</span>
          </div>
          <div className="wizard-step-line" />
          <div className="wizard-step">
            <span className="wizard-step-number">3</span>
            <span className="wizard-step-label">Review</span>
          </div>
          <div className="wizard-step-line" />
          <div className="wizard-step error">
            <span className="wizard-step-number">4</span>
            <span className="wizard-step-label">Deploy</span>
            <span className="wizard-step-helper">Failed</span>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 27. INFO BANNER & STAT CARDS                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Info Banner" desc="Accent-tinted informational strip with icon and text.">
        <div className="info-banner" style={{ marginBottom: 0 }}>
          <span className="info-banner-icon"><IconInfo size={20} /></span>
          <div className="info-banner-content">
            <div className="info-banner-title">Getting Started</div>
            <div className="info-banner-text">Configure your first agent to start automating workflows.</div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  AVATARS                                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Avatars" desc="Photo, initials, icon, and counter avatars with presence indicators across 7 sizes.">
        <div className="showcase-label">Photo</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          <Avatar type="photo" size="xx-large" src="https://i.pravatar.cc/248?img=12" name="Molly" />
          <Avatar type="photo" size="x-large" src="https://i.pravatar.cc/176?img=12" name="Molly" />
          <Avatar type="photo" size="large" src="https://i.pravatar.cc/144?img=12" name="Molly" />
          <Avatar type="photo" size="midsize" src="https://i.pravatar.cc/128?img=12" name="Molly" />
          <Avatar type="photo" size="small" src="https://i.pravatar.cc/96?img=12" name="Molly" />
          <Avatar type="photo" size="x-small" src="https://i.pravatar.cc/64?img=12" name="Molly" />
          <Avatar type="photo" size="xx-small" src="https://i.pravatar.cc/48?img=12" name="Molly" />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Initials</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          <Avatar type="initials" size="xx-large" name="Sarah Smith" />
          <Avatar type="initials" size="x-large" name="Sarah Smith" />
          <Avatar type="initials" size="large" name="Sarah Smith" />
          <Avatar type="initials" size="midsize" name="Sarah Smith" />
          <Avatar type="initials" size="small" name="Sarah Smith" />
          <Avatar type="initials" size="x-small" name="Sarah Smith" />
          <Avatar type="initials" size="xx-small" name="Sarah Smith" />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Icon</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          <Avatar type="icon" size="xx-large" />
          <Avatar type="icon" size="x-large" />
          <Avatar type="icon" size="large" />
          <Avatar type="icon" size="midsize" />
          <Avatar type="icon" size="small" />
          <Avatar type="icon" size="x-small" />
          <Avatar type="icon" size="xx-small" />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Counter</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          <Avatar type="counter" size="xx-large" count={99} />
          <Avatar type="counter" size="x-large" count={99} />
          <Avatar type="counter" size="large" count={99} />
          <Avatar type="counter" size="midsize" count={99} />
          <Avatar type="counter" size="small" count={99} />
          <Avatar type="counter" size="x-small" count={99} />
          <Avatar type="counter" size="xx-small" count={99} />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>Presence</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          <Avatar type="photo" size="x-large" src="https://i.pravatar.cc/176?img=12" name="Molly" presence="active" />
          <Avatar type="photo" size="x-large" src="https://i.pravatar.cc/176?img=12" name="Molly" presence="meet" />
          <Avatar type="photo" size="x-large" src="https://i.pravatar.cc/176?img=12" name="Molly" presence="dnd" />
          <Avatar type="photo" size="x-large" src="https://i.pravatar.cc/176?img=12" name="Molly" presence="away" />
          <Avatar type="photo" size="x-large" src="https://i.pravatar.cc/176?img=12" name="Molly" presence="schedule" />
          <Avatar type="photo" size="x-large" src="https://i.pravatar.cc/176?img=12" name="Molly" presence="ooo" />
        </div>

        <div className="showcase-label" style={{ marginTop: 16 }}>States</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          <div className="showcase-col" style={{ alignItems: 'center' }}>
            <div className="showcase-label">Normal</div>
            <Avatar type="photo" size="large" src="https://i.pravatar.cc/144?img=12" name="Molly" />
          </div>
          <div className="showcase-col" style={{ alignItems: 'center' }}>
            <div className="showcase-label">Disabled</div>
            <Avatar type="photo" size="large" src="https://i.pravatar.cc/144?img=12" name="Molly" disabled />
          </div>
          <div className="showcase-col" style={{ alignItems: 'center' }}>
            <div className="showcase-label">Ghost</div>
            <Avatar type="photo" size="large" src="https://i.pravatar.cc/144?img=12" name="Molly" ghost />
          </div>
          <div className="showcase-col" style={{ alignItems: 'center' }}>
            <div className="showcase-label">Interactive</div>
            <Avatar type="photo" size="large" src="https://i.pravatar.cc/144?img=12" name="Molly" interactive />
          </div>
        </div>
      </Section>

      <Section searchQuery={normalizedDashSearch} title="Stat Cards" desc="Metric display cards for dashboards and analytics.">
        <div className="showcase-grid-4">
          {[
            { label: 'Total Agents', value: '24' },
            { label: 'Active Sessions', value: '1,847' },
            { label: 'Avg. Resolution', value: '92%' },
            { label: 'Response Time', value: '1.2s' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 28, fontWeight: 700, lineHeight: '36px', color: 'var(--text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 28. ANNOUNCEMENT DIALOG                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Announcement Dialog" desc="Feature announcement overlay with visual, title, and CTA.">
        <div className="announcement-dialog" style={{ position: 'relative', maxWidth: 520, animation: 'none', boxShadow: 'none', border: '1px solid var(--border-color)' }}>
          <div className="announcement-dialog__visual" style={{ minHeight: 120 }}>
            <IconStar size={48} />
          </div>
          <div className="announcement-dialog__body">
            <h3 className="announcement-dialog__title">New Feature Available</h3>
            <p className="announcement-dialog__description">We have added multi-language support for your agents. Configure translation settings in the agent profile.</p>
          </div>
          <div className="announcement-dialog__footer">
            <Button variant="tertiary" size={32}>Maybe Later</Button>
            <Button variant="primary" size={32}>Try It Now</Button>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* AI SYMBOL / LOGO                                      */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Cisco AI Assistant Symbol" desc="Animated AI logo with static, processing, and responding motion states. Supports multiple sizes and grayscale variant.">
        <div className="showcase-label">Sizes</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          {[16, 20, 24, 32, 48, 64].map(s => (
            <div key={s} className="showcase-col" style={{ alignItems: 'center' }}>
              <AiSymbol size={s} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s}px</span>
            </div>
          ))}
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>Motion states — click buttons to switch</div>
        <AiSymbolDemo />

        <div className="showcase-label" style={{ marginTop: 24 }}>Grayscale (inactive)</div>
        <div className="showcase-row" style={{ alignItems: 'center' }}>
          <AiSymbol size={32} variant="grayscale" />
          <AiSymbol size={48} variant="grayscale" />
        </div>

        <div className="showcase-label" style={{ marginTop: 24 }}>On dark surface</div>
        <div style={{ display: 'inline-flex', gap: 24, alignItems: 'center', padding: '20px 28px', borderRadius: 12, background: '#0a0a0a' }}>
          <AiSymbol size={48} />
          <AiSymbol size={48} state="processing" />
          <AiSymbol size={48} state="responding" />
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 30. POPOVER                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="Popover" desc="Floating content surface with close button and tonal/contrast variants.">
        <div className="showcase-row-start">
          <div className="showcase-col">
            <div className="showcase-label">Contrast</div>
            <div className="popover-surface popover-surface--contrast popover-surface--show-close" style={{ position: 'relative', zIndex: 'auto', maxWidth: 280 }}>
              <button className="popover-close" aria-label="Close"><IconX size={14} /></button>
              <div className="popover-body">
                <p style={{ fontSize: 14, lineHeight: '20px' }}>This is a contrast popover with a close button. It uses inverted colors for emphasis.</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="showcase-divider" />

      {/* ═══════════════════════════════════════════════════════ */}
      {/* 31. AI ASSISTANT SYSTEM                               */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Section searchQuery={normalizedDashSearch} title="AI Prompt Buttons" desc="Pill-shaped prompt buttons and card prompt buttons for AI assistant interactions. Supports default, icon, and AI brand variants.">
        <div className="showcase-row-start" style={{ flexDirection: 'column', gap: 24 }}>
          <div>
            <div className="showcase-label">Prompt Button — Default</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <AiPromptButton>Label</AiPromptButton>
              <AiPromptButton disabled>Label</AiPromptButton>
            </div>
          </div>
          <div>
            <div className="showcase-label">Prompt Button — With Icon</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <AiPromptButton icon="sparkle-bold">Label</AiPromptButton>
              <AiPromptButton icon="sparkle-bold" disabled>Label</AiPromptButton>
            </div>
          </div>
          <div>
            <div className="showcase-label">Prompt Button — AI Brand</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <AiPromptButton icon="ai">Label</AiPromptButton>
              <AiPromptButton icon="ai" disabled>Label</AiPromptButton>
            </div>
          </div>
          <div>
            <div className="showcase-label">Prompt Card Button</div>
            <div style={{ display: 'flex', gap: 12, maxWidth: 560 }}>
              <AiPromptCardButton>Summarize my recent activity</AiPromptCardButton>
              <AiPromptCardButton disabled>Disabled prompt card</AiPromptCardButton>
            </div>
          </div>
        </div>
      </Section>

      <Section searchQuery={normalizedDashSearch} title="AI Chat Text Area" desc="Multi-line text input for AI assistant conversations. Supports placeholder/typed states, sources button, auto-resize, and send action.">
        <AiChatTextAreaDemo />
      </Section>

      <Section searchQuery={normalizedDashSearch} title="AI Container Header" desc="Header bar for the AI assistant shell with title, pop-out, view mode menu, and close buttons. Large and small size variants.">
        <AiContainerHeaderDemo />
      </Section>

      <Section searchQuery={normalizedDashSearch} title="AI Notification" desc="Notification items for the AI assistant. Supports unread/read states, severity badges, action buttons, timestamp, and more menu.">
        <AiNotificationDemo />
      </Section>

      <Section searchQuery={normalizedDashSearch} title="AI Assistant System" desc="Full AI assistant panel with conversation, threads, notifications, and multi-view shell.">
        <div className="showcase-row-start" style={{ flexDirection: 'column', gap: 16 }}>
          <div className="showcase-label">Click the AI button in the header to launch the assistant, or use the demo below:</div>
          <AiAssistantDemo />
        </div>
      </Section>
    </>
  )
}

/**
 * Button-driven demo that opens a floating AI assistant shell with nav rail and welcome content.
 * @param {Object} props - Unused; open/close state is held locally.
 * @example
 * <AiAssistantDemo />
 */
function AiAssistantDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>Open AI Assistant</button>
      {open && (
        <>
          <div className="ai-shell-overlay" onClick={() => setOpen(false)} />
          <div className="ai-shell ai-shell--floating-lg" role="dialog" aria-label="AI Assistant Demo">
            <AiContainerHeader size="large" viewMode="floating" onClose={() => setOpen(false)} />
            <div className="ai-shell__body">
              <div className="ai-shell__nav">
                <nav className="ai-nav-rail">
                  <button type="button" className="ai-nav-rail__item ai-nav-rail__item--active"><div className="ai-nav-rail__marker"><div className="ai-nav-rail__marker-pip" /></div><div className="ai-nav-rail__icon"><AiSymbol size={24} /></div></button>
                  <button type="button" className="ai-nav-rail__item"><div className="ai-nav-rail__marker" /><div className="ai-nav-rail__icon"><Icon name="alert-bold" size={24} /></div></button>
                  <button type="button" className="ai-nav-rail__item"><div className="ai-nav-rail__marker" /><div className="ai-nav-rail__icon"><Icon name="settings-bold" size={24} /></div></button>
                </nav>
              </div>
              <div className="ai-shell__content">
                <div className="ai-welcome">
                  <AiSymbol size={64} />
                  <h2 className="ai-welcome__heading">Meet your AI Assistant</h2>
                  <p className="ai-welcome__desc">I&apos;m here to help you with questions, tasks, and more. Try asking me something or pick a suggestion below.</p>
                  <div className="ai-welcome__suggestions">
                    <button type="button" className="ai-footer__suggestion">Summarize my recent activity</button>
                    <button type="button" className="ai-footer__suggestion">Draft a follow-up email</button>
                    <button type="button" className="ai-footer__suggestion">Help me prepare for my meeting</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

/**
 * Stacked examples of AiContainerHeader for large and small sizes with a shared view mode control.
 * @param {Object} props - Unused; view mode state is held locally.
 * @example
 * <AiContainerHeaderDemo />
 */
function AiContainerHeaderDemo() {
  const [mode, setMode] = useState('docked')
  return (
    <div className="showcase-row-start" style={{ flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="showcase-label">Large Header</div>
        <div style={{ maxWidth: 900, borderRadius: '12px 12px 0 0', overflow: 'visible', position: 'relative', background: 'var(--mds-color-theme-background-solid-tertiary-normal, #262626)' }}>
          <AiContainerHeader
            size="large"
            viewMode={mode}
            onViewModeChange={setMode}
            onClose={() => {}}
            onPopOut={() => {}}
          />
        </div>
      </div>
      <div>
        <div className="showcase-label">Small Header</div>
        <div style={{ maxWidth: 480, borderRadius: '12px 12px 0 0', overflow: 'visible', position: 'relative', background: 'var(--mds-color-theme-background-solid-tertiary-normal, #262626)' }}>
          <AiContainerHeader
            size="small"
            viewMode={mode}
            onViewModeChange={setMode}
            onClose={() => {}}
            onPopOut={() => {}}
            onMenuClick={() => {}}
          />
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        Current view mode: <strong style={{ color: 'var(--text-primary)' }}>{mode}</strong> — click the side-panel button to open the menu and switch.
      </div>
    </div>
  )
}

/**
 * Column of AiChatTextArea variants (placeholder, value, sources on/off, disabled) for visual regression in the showcase.
 * @param {Object} props - Unused; field values use local state.
 * @example
 * <AiChatTextAreaDemo />
 */
function AiChatTextAreaDemo() {
  const [val1, setVal1] = useState('')
  const [val2, setVal2] = useState('Typed text')
  const [val3, setVal3] = useState('')
  const [val4, setVal4] = useState('Typed text')
  return (
    <div className="showcase-row-start" style={{ flexDirection: 'column', gap: 24, maxWidth: 560 }}>
      <div>
        <div className="showcase-label">Placeholder — Sources Shown</div>
        <AiChatTextArea value={val1} onChange={setVal1} onSend={() => setVal1('')} />
      </div>
      <div>
        <div className="showcase-label">Typed — Sources Shown</div>
        <AiChatTextArea value={val2} onChange={setVal2} onSend={() => setVal2('')} />
      </div>
      <div>
        <div className="showcase-label">Placeholder — Sources Hidden</div>
        <AiChatTextArea value={val3} onChange={setVal3} onSend={() => setVal3('')} showSources={false} />
      </div>
      <div>
        <div className="showcase-label">Typed — Sources Hidden</div>
        <AiChatTextArea value={val4} onChange={setVal4} onSend={() => setVal4('')} showSources={false} />
      </div>
      <div>
        <div className="showcase-label">Disabled</div>
        <AiChatTextArea value="" onChange={() => {}} disabled />
      </div>
    </div>
  )
}

/**
 * Vertical gallery of AiNotification examples covering unread/read, actions, dividers, and badge severities.
 * @param {Object} props - Unused; static sample data only.
 * @example
 * <AiNotificationDemo />
 */
function AiNotificationDemo() {
  return (
    <div className="showcase-row-start" style={{ flexDirection: 'column', gap: 0, maxWidth: 700, borderRadius: 8, overflow: 'hidden' }}>
      <div className="showcase-label" style={{ marginBottom: 8 }}>Unread — with actions</div>
      <AiNotification
        title="Title for the unread notification"
        body="This is a sample of an AI Assistant notification. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget efficitur quam."
        time="10m"
        badge="warning"
        actions={[
          { label: 'Main action', variant: 'primary' },
          { label: 'Additional action', variant: 'secondary' },
        ]}
        onMore={() => {}}
        showDivider={false}
      />
      <AiNotification
        title="Title for the unread notification"
        body="This is a sample of an AI Assistant notification. Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        time="2h"
        badge="error"
        actions={[
          { label: 'Review', variant: 'primary' },
        ]}
        onMore={() => {}}
      />
      <div className="showcase-label" style={{ marginTop: 16, marginBottom: 8 }}>Read — no actions</div>
      <AiNotification
        title="Title for the read notification"
        body="This is a sample of an AI Assistant notification. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi eget efficitur quam."
        time="10m"
        read
        badge="warning"
        onMore={() => {}}
        showDivider={false}
      />
      <AiNotification
        title="Title for the read notification"
        body="This is a sample of an AI Assistant notification. Lorem ipsum dolor sit amet."
        time="1d"
        read
        badge="info"
        onMore={() => {}}
      />
      <div className="showcase-label" style={{ marginTop: 16, marginBottom: 8 }}>Badge variants</div>
      <AiNotification
        title="Warning notification"
        body="A warning-level alert from the AI assistant."
        time="5m"
        badge="warning"
        showDivider={false}
        onMore={() => {}}
      />
      <AiNotification
        title="Error notification"
        body="An error-level notification from the AI assistant."
        time="12m"
        badge="error"
        onMore={() => {}}
      />
      <AiNotification
        title="Info notification"
        body="An informational update from the AI assistant."
        time="30m"
        badge="info"
        onMore={() => {}}
      />
      <AiNotification
        title="Success notification"
        body="A successful operation completed by the AI assistant."
        time="1h"
        badge="success"
        onMore={() => {}}
      />
    </div>
  )
}

export default Dashboard
