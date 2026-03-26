import { Icon } from '../../icons';
import { CiscoAiSymbolMark } from '../brand';

export default function Header() {
  return (
    <header className="header">
      {/* Left Section */}
      <div className="header-left">
        <button className="header-btn-primary">
          <Icon name="list-menu" weight="bold" size={20} color="var(--bg-primary)" />
        </button>
        <div className="header-wordmark">
          <span className="webex-text">webex</span>
        </div>
      </div>
      
      {/* Vertical Divider */}
      <div className="header-divider"></div>
      
      {/* App Label */}
      <span className="header-app-label">AI Agent Studio</span>
      
      {/* Spacer */}
      <div className="header-spacer"></div>
      
      {/* Right Section */}
      <div className="header-right">
        <button type="button" className="header-btn-ai" aria-label="AI assistant">
          <CiscoAiSymbolMark height={24} aria-hidden />
        </button>
        
        <button className="header-btn">
          <Icon name="email" weight="bold" size="md" />
        </button>
        
        <button className="header-btn">
          <Icon name="help-circle" weight="bold" size="md" />
        </button>
        
        <button className="header-btn">
          <Icon name="alert" weight="bold" size="md" />
        </button>
        
        <button className="header-btn">
          <Icon name="waffle-menu" weight="bold" size="md" />
        </button>
        
        {/* Avatar */}
        <div className="header-avatar">
          <img src="https://i.pravatar.cc/32?img=8" alt="User" />
        </div>
      </div>
    </header>
  );
}
