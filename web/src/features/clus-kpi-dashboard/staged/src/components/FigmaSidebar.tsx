import svgPaths from "../imports/svg-pv4f8d08tt";

interface FigmaSidebarProps {
  activeView?: 'observability' | 'ai-agents';
  onNavigate?: (view: 'observability' | 'ai-agents') => void;
}

function MarkerContainer() {
  return <div className="content-stretch flex gap-[10px] h-full items-center shrink-0 w-[4px]" data-name="Marker Container">
    <div className="bg-[rgba(255,255,255,0.95)] h-[16px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-[4px]" data-name="marker-active-semi" />
  </div>;
}

function MarkerContainerEmpty() {
  return <div className="content-stretch flex gap-[10px] h-full items-center shrink-0 w-[4px]" data-name="Marker Container" />;
}

function BotCustomerAssistant() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="bot-customer-assistant">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="bot-customer-assistant">
          <g id="Vector">
            <path d={svgPaths.p20195900} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p292b9780} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1af8b860} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p317da900} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p3eb4c580} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function BaseSideNavigationTab({ isActive }: { isActive: boolean }) {
  return (
    <div className={`basis-0 grow min-h-px min-w-px relative rounded-[20px] shrink-0 ${isActive ? 'bg-[rgba(255,255,255,0.2)]' : 'bg-[rgba(255,255,255,0)]'}`} data-name=".Base - Side Navigation Tab">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <BotCustomerAssistant />
          <p className={`basis-0 grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] ${isActive ? "font-['Inter:bold',sans-serif]" : "font-['Inter:medium',sans-serif]"}`}>AI Agents</p>
        </div>
      </div>
    </div>
  );
}

function NavigationItem({ isActive, onClick }: { isActive: boolean; onClick?: () => void }) {
  return (
    <div 
      className="content-stretch flex gap-[16px] h-[40px] items-center relative shrink-0 w-full cursor-pointer" 
      data-name="Navigation Item"
      onClick={onClick}
    >
      {isActive ? <MarkerContainer /> : <MarkerContainerEmpty />}
      <BaseSideNavigationTab isActive={isActive} />
    </div>
  );
}

function MarkerContainer1() {
  return <div className="content-stretch flex gap-[10px] h-full items-center shrink-0 w-[4px]" data-name="Marker Container" />;
}

function PrimaryParticipant() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="primary-participant">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="primary-participant">
          <g id="Vector">
            <path d={svgPaths.p2fed6980} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function BaseSideNavTab() {
  return (
    <div className="basis-0 bg-[rgba(255,255,255,0)] grow min-h-px min-w-px relative rounded-[20px] shrink-0" data-name=".Base - Side Nav Tab">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <PrimaryParticipant />
          <p className="basis-0 font-['Inter:medium',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)]">AI Assistant</p>
        </div>
      </div>
    </div>
  );
}

function SideNavItemPopoverStyle() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full" data-name=".Side Nav Item - Popover Style">
      <div className="flex flex-row items-center self-stretch">
        <MarkerContainer1 />
      </div>
      <BaseSideNavTab />
    </div>
  );
}

function MarkerContainer2() {
  return <div className="content-stretch flex gap-[10px] h-full items-center shrink-0 w-[4px]" data-name="Marker Container" />;
}

function Widget() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="widget">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="widget">
          <g id="Vector">
            <path d={svgPaths.p1c803800} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p28e7cc00} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p323ed080} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p20692240} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function BaseSideNavigationTab1() {
  return (
    <div className="basis-0 bg-[rgba(255,255,255,0)] grow min-h-px min-w-px relative rounded-[20px] shrink-0" data-name=".Base - Side Navigation Tab">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <Widget />
          <p className="basis-0 font-['Inter:medium',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)]">Knowledge</p>
        </div>
      </div>
    </div>
  );
}

function NavigationItem1() {
  return (
    <div className="content-stretch flex gap-[16px] h-[40px] items-center relative shrink-0 w-full" data-name="Navigation Item">
      <MarkerContainer2 />
      <BaseSideNavigationTab1 />
    </div>
  );
}

function MarkerContainer3() {
  return <div className="content-stretch flex gap-[10px] h-full items-center relative shrink-0 w-[4px]" data-name="Marker Container" />;
}

function MultilineChart() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="multiline-chart">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="multiline-chart">
          <g id="Vector">
            <path d={svgPaths.p13a34500} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p1b85ee00} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p33aa3780} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function BaseSideNavigationTab2({ isActive }: { isActive: boolean }) {
  return (
    <div className={`basis-0 grow min-h-px min-w-px relative rounded-[20px] shrink-0 ${isActive ? 'bg-[rgba(255,255,255,0.2)]' : 'bg-[rgba(255,255,255,0)]'}`} data-name=".Base - Side Navigation Tab">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <MultilineChart />
          <p className={`basis-0 grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] ${isActive ? "font-['Inter:bold',sans-serif]" : "font-['Inter:medium',sans-serif]"}`}>Observability</p>
        </div>
      </div>
    </div>
  );
}

function NavigationItem2({ isActive, onClick }: { isActive: boolean; onClick?: () => void }) {
  return (
    <div 
      className="content-stretch flex gap-[16px] h-[40px] items-center relative shrink-0 w-full cursor-pointer" 
      data-name="Navigation Item"
      onClick={onClick}
    >
      {isActive ? <MarkerContainer /> : <MarkerContainerEmpty />}
      <BaseSideNavigationTab2 isActive={isActive} />
    </div>
  );
}

function NavSectionPopoverStyle({ activeView, onNavigate }: { activeView?: 'observability' | 'ai-agents', onNavigate?: (view: 'observability' | 'ai-agents') => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name=".Nav Section - Popover Style">
      <NavigationItem 
        isActive={activeView === 'ai-agents'} 
        onClick={() => onNavigate?.('ai-agents')}
      />
      <SideNavItemPopoverStyle />
      <NavigationItem1 />
      <NavigationItem2 
        isActive={activeView === 'observability'} 
        onClick={() => onNavigate?.('observability')}
      />
    </div>
  );
}

function UpperSectionScrollable({ activeView, onNavigate }: { activeView?: 'observability' | 'ai-agents', onNavigate?: (view: 'observability' | 'ai-agents') => void }) {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px overflow-clip px-0 py-[16px] relative shrink-0 w-full" data-name="Upper Section (Scrollable)">
      <NavSectionPopoverStyle activeView={activeView} onNavigate={onNavigate} />
    </div>
  );
}

function Company() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="company">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="company">
          <g id="Vector">
            <path d={svgPaths.p483f200} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p22375600} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p27fb19e0} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p19ec61f0} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p35adfa00} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1a374280} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p2672b180} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p311be440} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p2f9bdd00} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1a245e80} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.pd038400} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1b540100} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p31ad5a00} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p135ae180} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p323fff80} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1b9d9af0} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function CustomerLogo() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-[20px] shrink-0 w-full" data-name=".Customer Logo">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center pl-[28px] pr-0 py-[8px] relative w-full">
          <Company />
          <p className="basis-0 font-['Inter:medium',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)]">Acme Inc</p>
        </div>
      </div>
    </div>
  );
}

function LowerSectionFixed() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[4px] items-start pb-[16px] pt-0 px-0 relative shrink-0 w-full" data-name="Lower Section (Fixed)">
      <CustomerLogo />
    </div>
  );
}

function SideNavigationPopover({ activeView, onNavigate }: { activeView?: 'observability' | 'ai-agents', onNavigate?: (view: 'observability' | 'ai-agents') => void }) {
  return (
    <div className="content-stretch flex flex-col h-full items-start relative shrink-0 w-[240px]" data-name="Side Navigation - Popover">
      <UpperSectionScrollable activeView={activeView} onNavigate={onNavigate} />
      <LowerSectionFixed />
    </div>
  );
}

export function FigmaSidebar({ activeView = 'observability', onNavigate }: FigmaSidebarProps) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 z-[2] h-full" data-name="CX Studio Side Navigation">
      <SideNavigationPopover activeView={activeView} onNavigate={onNavigate} />
    </div>
  );
}