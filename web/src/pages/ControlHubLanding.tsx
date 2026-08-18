import { useNavigate } from 'react-router-dom';
import MomentumIcon from '../components/shared/Icon';
import ciscoCloudControl from '../assets/control-hub/cisco-cloud-control.png';
import umarPatel from '../assets/control-hub/umar-patel.png';
import './ControlHubLanding.css';

type HubIconProps = {
  name: string;
  size?: number;
  className?: string;
};

function HubIcon({ name, size = 16, className = '' }: HubIconProps) {
  return <MomentumIcon name={name} size={size} className={className} />;
}

const overviewItems = [
  { label: 'Overview', icon: 'home-regular', active: true },
  { label: 'Favorites', icon: 'favorite-regular' },
  { label: 'Alerts', icon: 'alert-regular' },
];

const monitoringItems = [
  { label: 'Analytics', icon: 'multiline-chart-regular' },
  { label: 'Troubleshooting', icon: 'helpdesk-regular' },
  { label: 'Reports', icon: 'application-panel-regular' },
];

const managementItems = [
  { label: 'Users', icon: 'user-regular' },
  { label: 'Groups', icon: 'people-regular' },
  { label: 'Locations', icon: 'location-regular' },
  { label: 'Workspaces', icon: 'company-regular' },
  { label: 'Devices', icon: 'devices-regular' },
  { label: 'Apps', icon: 'apps-regular' },
  { label: 'Account', icon: 'company-regular' },
  { label: 'Security & Privacy', icon: 'secure-lock-regular' },
  { label: 'Organization settings', icon: 'settings-regular' },
];

function BrowserChrome() {
  return (
    <div className="control-hub-browser" aria-hidden>
      <div className="control-hub-browser__tabs">
        <div className="control-hub-browser__lights"><span /><span /><span /></div>
        <div className="control-hub-browser__tab">
          <span className="control-hub-browser__tab-mark">CISCO</span>
          <span>Cloud Control</span>
          <span className="control-hub-browser__tab-close">×</span>
        </div>
        <span className="control-hub-browser__new-tab">+</span>
      </div>
      <div className="control-hub-browser__address-row">
        <span>‹</span><span>›</span><span>↻</span>
        <div className="control-hub-browser__address">
          <HubIcon name="secure-lock-regular" size={12} />
          <span>https://cloud.cisco.com/</span>
        </div>
        <HubIcon name="favorite-regular" size={16} />
        <span className="control-hub-browser__menu">⋮</span>
      </div>
    </div>
  );
}

function ControlHubHeader() {
  return (
    <header className="control-hub-global-header">
      <div className="control-hub-global-header__left">
        <img src={ciscoCloudControl} alt="Cisco Cloud Control" className="control-hub-wordmark" />
        <span className="control-hub-global-header__divider" />
        <button type="button" className="control-hub-header-control control-hub-region">North America <span>⌄</span></button>
        <button type="button" className="control-hub-icon-button" aria-label="Applications"><HubIcon name="applications-bold" size={22} /></button>
        <button type="button" className="control-hub-product-pill"><HubIcon name="home-regular" size={15} />Home</button>
        <button type="button" className="control-hub-product-pill control-hub-product-pill--selected">
          <HubIcon name="company-regular" size={16} />Collaboration Control Hub
        </button>
      </div>
      <div className="control-hub-global-header__right">
        <label className="control-hub-search">
          <HubIcon name="search-regular" size={16} />
          <input aria-label="Search Collaboration Control Hub" placeholder="Search Collaboration Control Hub" />
        </label>
        <button type="button" className="control-hub-header-link"><span className="control-hub-assistant-mark" />Assistant</button>
        <button type="button" className="control-hub-header-link"><span className="control-hub-canvas-mark" />Canvas</button>
        <span className="control-hub-global-header__divider" />
        <button type="button" className="control-hub-icon-button" aria-label="Panels"><HubIcon name="application-panel-regular" size={18} /></button>
        <button type="button" className="control-hub-icon-button control-hub-icon-button--badge" aria-label="Notifications"><HubIcon name="alert-regular" size={18} /><span>6</span></button>
        <button type="button" className="control-hub-icon-button" aria-label="Help"><HubIcon name="help-circle-regular" size={18} /></button>
        <button type="button" className="control-hub-icon-button control-hub-icon-button--status" aria-label="Tasks"><HubIcon name="applications-regular" size={18} /></button>
        <img src={umarPatel} alt="Umar Patel" className="control-hub-avatar" />
      </div>
    </header>
  );
}

type NavItemProps = {
  label: string;
  icon: string;
  active?: boolean;
  external?: boolean;
  onClick?: () => void;
};

function HubNavItem({ label, icon, active, external, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      className={`control-hub-nav-item${active ? ' control-hub-nav-item--active' : ''}`}
      onClick={onClick}
    >
      <HubIcon name={icon} size={16} />
      <span>{label}</span>
      {external && <HubIcon name="pop-out-regular" size={14} className="control-hub-nav-item__external" />}
    </button>
  );
}

function ControlHubSideNav() {
  const navigate = useNavigate();
  return (
    <nav className="control-hub-sidenav" aria-label="Collaboration Control Hub navigation">
      <div className="control-hub-sidenav__title"><HubIcon name="list-menu-regular" size={16} />Collaboration Control Hub</div>
      <div className="control-hub-sidenav__scroll">
        <div className="control-hub-sidenav__group control-hub-sidenav__group--top">
          {overviewItems.map(item => <HubNavItem key={item.label} {...item} />)}
        </div>
        <div className="control-hub-sidenav__group">
          <div className="control-hub-sidenav__section-title">AI Management</div>
          <HubNavItem label="AI Agent Studio" icon="bot-regular" external onClick={() => navigate('/new-agent')} />
          <HubNavItem label="AI settings" icon="settings-regular" />
          <HubNavItem label="Agentic apps" icon="apps-regular" />
        </div>
        <div className="control-hub-sidenav__group">
          <div className="control-hub-sidenav__section-title">Monitoring</div>
          {monitoringItems.map(item => <HubNavItem key={item.label} {...item} />)}
        </div>
        <div className="control-hub-sidenav__group">
          <div className="control-hub-sidenav__section-title">Management</div>
          {managementItems.map(item => <HubNavItem key={item.label} {...item} />)}
        </div>
        <div className="control-hub-sidenav__group">
          <div className="control-hub-sidenav__section-title">Nav Section Title</div>
          <HubNavItem label="Nav Item" icon="cancel-regular" active />
          <HubNavItem label="Nav Item" icon="cancel-regular" />
        </div>
      </div>
    </nav>
  );
}

type CardFrameProps = {
  title: string;
  className?: string;
  children: React.ReactNode;
};

function CardFrame({ title, className = '', children }: CardFrameProps) {
  return (
    <section className={`control-hub-card ${className}`}>
      <div className="control-hub-card__header">
        <div className="control-hub-card__title"><HubIcon name="dragger-vertical-regular" size={16} />{title}<HubIcon name="info-circle-regular" size={11} /></div>
        <div className="control-hub-card__actions"><span>⋮</span><HubIcon name="delete-regular" size={14} /></div>
      </div>
      {children}
    </section>
  );
}

function KpiCard({ title, value, note, trend }: { title: string; value: string; note: string; trend?: string }) {
  return (
    <CardFrame title={title} className="control-hub-kpi-card">
      <div className="control-hub-kpi-card__value">{value}{trend && <span>{trend}</span>}</div>
      <div className="control-hub-kpi-card__note">{note}</div>
    </CardFrame>
  );
}

const updateLinks = [
  'Support for timezone selection in Control Hub Devices analytics',
  'Troubleshooting data for users and devices joining external meetings',
  'Role-based access control support for analytics dashboards in Control Hub',
  'Enhance the Flex license check for defining a Wholesale organization',
  'Delete Directory Connector and Entra ID groups from Control Hub',
];

function MeetingsChart() {
  return (
    <div className="control-hub-chart" aria-label="Total meetings line chart">
      <div className="control-hub-chart__axis-label">Axis label</div>
      <div className="control-hub-chart__y-labels"><span>100%</span><span>80%</span><span>60%</span><span>40%</span></div>
      <svg viewBox="0 0 560 270" preserveAspectRatio="none" aria-hidden>
        <line x1="36" y1="12" x2="36" y2="256" className="axis" />
        <polyline points="36,94 130,106 222,145 315,136 408,160 500,144" className="line line--green" />
        <polyline points="36,145 130,158 222,145 315,158 408,145 500,145" className="line line--purple" />
        <polyline points="36,193 130,198 222,211 315,205 408,211 500,218" className="line line--pink" />
        <polyline points="36,145 130,209 222,145 315,209 408,145 500,145" className="line line--teal" />
        <polyline points="36,208 130,218 222,246 315,239 408,255 500,268" className="line line--blue" />
      </svg>
      <div className="control-hub-chart__legend">
        {['#643abd', '#f0677e', '#ebd460', '#00a3b5', '#93c437'].map((color, index) => (
          <span key={color}><i style={{ backgroundColor: color }} />Label{index ? '' : ''}</span>
        ))}
      </div>
    </div>
  );
}

function ControlHubOverview() {
  return (
    <main className="control-hub-main">
      <div className="control-hub-main__header">
        <h1>Overview</h1>
        <div className="control-hub-main__tools">
          <span>Last 7 days | (GMT +00:00) UTC <HubIcon name="info-circle-regular" size={12} /></span>
          <button type="button"><HubIcon name="edit-regular" size={14} />Customize</button>
        </div>
      </div>
      <div className="control-hub-overview-grid">
        <div className="control-hub-overview-grid__primary">
          <div className="control-hub-kpi-grid">
            <KpiCard title="Total users" value="4869" note="As of today" />
            <KpiCard title="Total devices" value="678" note="As of" />
            <KpiCard title="Total call logs" value="678" trend="↑ 10%" note="Avg. 3 call legs" />
          </div>
          <CardFrame title="Your assigned roles" className="control-hub-roles-card">
            <div className="control-hub-roles-card__content">
              <div className="control-hub-roles-card__count"><span>1</span><HubIcon name="admin-regular" size={23} /><small>Admin roles</small></div>
              <div><strong>Calling user custom role</strong><span>Can create user and edit calling features</span></div>
            </div>
          </CardFrame>
          <CardFrame title="Strengthen your organization’s security for hybrid work" className="control-hub-security-card">
            <div className="control-hub-security-card__content">
              <div className="control-hub-security-illustration"><HubIcon name="shield-regular" size={64} /></div>
              <div className="control-hub-security-copy"><small>Current level <HubIcon name="info-circle-regular" size={10} /></small><strong>Default security</strong><span>To reach the next three security levels, either complete or dismiss the tasks for each level.</span></div>
              <div className="control-hub-security-levels">
                <div><span>Standard <HubIcon name="info-circle-regular" size={10} /></span><strong>50%</strong><small>Completed</small><button type="button">Continue</button></div>
                <div><span>Enhanced <HubIcon name="info-circle-regular" size={10} /></span><strong>25%</strong><small>Completed</small><button type="button">Continue</button></div>
                <div><span>Advanced <HubIcon name="info-circle-regular" size={10} /></span><strong>0%</strong><small>Completed</small><button type="button">Start</button></div>
              </div>
            </div>
          </CardFrame>
          <CardFrame title="Total meetings" className="control-hub-meetings-card"><MeetingsChart /></CardFrame>
        </div>
        <aside className="control-hub-overview-grid__secondary">
          <CardFrame title="What’s new for June" className="control-hub-whats-new-card">
            <div className="control-hub-whats-new-card__intro">
              <HubIcon name="launch-regular" size={52} />
              <span>Launch Control Hub’s latest updates</span>
              <button type="button">View all <HubIcon name="pop-out-regular" size={11} /></button>
            </div>
            <ul>{updateLinks.map(link => <li key={link}><HubIcon name="application-panel-regular" size={10} /><a href="#updates">{link}</a></li>)}</ul>
          </CardFrame>
          <CardFrame title="Setup guide" className="control-hub-setup-card">
            <a href="#start"><HubIcon name="power-regular" size={12} />Start using Webex</a>
            <a href="#contact"><HubIcon name="user-regular" size={12} />Configure contact center</a>
            <a href="#calling"><HubIcon name="handset-regular" size={12} />Configure Calling services</a>
            <a href="#devices"><HubIcon name="devices-regular" size={12} />Add devices</a>
          </CardFrame>
        </aside>
      </div>
    </main>
  );
}

export default function ControlHubLanding() {
  return (
    <div className="control-hub-landing">
      <BrowserChrome />
      <ControlHubHeader />
      <div className="control-hub-workspace">
        <ControlHubSideNav />
        <ControlHubOverview />
      </div>
    </div>
  );
}
