import svgPaths from "./svg-pv4f8d08tt";
import img from "figma:asset/36387348b6b60c00599d2a32794099339c68eaf6.png";
import imgCoreAppShell from "figma:asset/c22556a75f9b2248e5bb2e52bdc5eea23430dc90.png";
import { imgLayout } from "./svg-qgkrh";

function ListMenu() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="list-menu">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="list-menu">
          <g id="Vector">
            <path d={svgPaths.p22196340} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1cda2400} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1aa22240} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <ListMenu />
    </div>
  );
}

function BaseIconButton() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[6px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper />
    </div>
  );
}

function SimpleButtonsIconButton() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[36px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton />
    </div>
  );
}

function WebexSuiteWordmark() {
  return (
    <div className="aspect-[222/28] basis-0 grow min-h-px min-w-px relative shrink-0" data-name="webex-suite-wordmark">
      <div className="absolute aspect-[221.646/24.1057] left-0 right-[0.16%] top-[1.03px]" data-name="Union">
        <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 222 25">
            <g id="Union">
              <path clipRule="evenodd" d={svgPaths.p18fdfe80} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path clipRule="evenodd" d={svgPaths.p1c947000} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path d={svgPaths.p1e48fd00} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path clipRule="evenodd" d={svgPaths.p25bfbd80} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path d={svgPaths.p24d395c0} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path clipRule="evenodd" d={svgPaths.p12264600} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path d={svgPaths.p3a337800} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path d={svgPaths.p26116f00} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path clipRule="evenodd" d={svgPaths.p37e6c780} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path d={svgPaths.p7e62f00} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path d={svgPaths.p245b0b00} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path d={svgPaths.pa45cc80} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path d={svgPaths.paaff580} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path d={svgPaths.pc900100} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path clipRule="evenodd" d={svgPaths.p9588800} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path clipRule="evenodd" d={svgPaths.p7450600} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path clipRule="evenodd" d={svgPaths.pe792200} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
              <path d={svgPaths.pdf3e800} fill="var(--fill-0, white)" fillOpacity="0.95" />
              <path clipRule="evenodd" d={svgPaths.p1b538530} fill="var(--fill-0, white)" fillOpacity="0.95" fillRule="evenodd" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

function WordmarkContainer() {
  return (
    <div className="box-border content-stretch flex flex-col h-[28px] items-start pl-[8px] pr-0 py-0 relative shrink-0" data-name="Wordmark Container">
      <WebexSuiteWordmark />
    </div>
  );
}

function MenuAndWordmark() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Menu and Wordmark">
      <SimpleButtonsIconButton />
      <WordmarkContainer />
    </div>
  );
}

function LeftContent() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name=".Left Content">
      <MenuAndWordmark />
    </div>
  );
}

function CiscoAiAssistantSymbol() {
  return (
    <div className="absolute inset-[-3.13%]" data-name="Cisco AI Assistant Symbol">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26 26">
        <g id="Cisco AI Assistant Symbol">
          <path d={svgPaths.p17ce4000} fill="url(#paint0_linear_1_218184)" id="Bottom Lens" />
          <path clipRule="evenodd" d={svgPaths.p17c68180} fill="url(#paint1_linear_1_218184)" fillRule="evenodd" id="Ring" />
          <g id="Inner Lens">
            <path d={svgPaths.p1e6b4000} fill="url(#paint2_linear_1_218184)" id="Intersect" />
          </g>
          <path d={svgPaths.p33d32500} fill="url(#paint3_radial_1_218184)" id="Top Lens" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_218184" x1="12.987" x2="22.7739" y1="2.39063" y2="12.1775">
            <stop stopColor="#0087EA" />
            <stop offset="1" stopColor="#63FFF7" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear_1_218184" x1="23.1094" x2="2.39659" y1="2.39666" y2="23.1154">
            <stop stopColor="#0051AF" />
            <stop offset="0.666238" stopColor="#0087EA" />
            <stop offset="1" stopColor="#00BCEB" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint2_linear_1_218184" x1="16.6903" x2="22.2301" y1="6.36834" y2="12.7732">
            <stop stopColor="#74BF4B" stopOpacity="0" />
            <stop offset="1" stopColor="#74BF4B" />
          </linearGradient>
          <radialGradient cx="0" cy="0" gradientTransform="translate(24.7 14.3437) rotate(-135) scale(16.9043 16.8971)" gradientUnits="userSpaceOnUse" id="paint3_radial_1_218184" r="1">
            <stop stopColor="#00BCEB" stopOpacity="0" />
            <stop offset="0.666962" stopColor="#00BCEB" stopOpacity="0" />
            <stop offset="1" stopColor="#00BCEB" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

function CiscoAiAssistant() {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]" data-name="cisco-ai-assistant">
      <CiscoAiAssistantSymbol />
    </div>
  );
}

function ButtonIconWrapper1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <CiscoAiAssistant />
    </div>
  );
}

function BaseIconButton1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[6px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper1 />
    </div>
  );
}

function SimpleButtonsIconButton1() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[36px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton1 />
    </div>
  );
}

function VerticalDivider() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-px" data-name="Vertical Divider">
      <div className="basis-0 grow h-full min-h-px min-w-px shrink-0" data-name="Line" />
    </div>
  );
}

function ProductButtons() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name=".Product Buttons">
      <SimpleButtonsIconButton1 />
      <div className="flex flex-row items-center self-stretch">
        <VerticalDivider />
      </div>
    </div>
  );
}

function Announcement() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="announcement">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="announcement">
          <path d={svgPaths.p10203b00} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <Announcement />
    </div>
  );
}

function BaseIconButton2() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[6px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper2 />
    </div>
  );
}

function SimpleButtonsIconButton2() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[36px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton2 />
    </div>
  );
}

function HelpCircle() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="help-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="help-circle">
          <g id="Vector">
            <path d={svgPaths.p37afd680} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p6ab2f70} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p3a90ce00} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <HelpCircle />
    </div>
  );
}

function BaseIconButton3() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[6px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper3 />
    </div>
  );
}

function SimpleButtonsIconButton3() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[36px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton3 />
    </div>
  );
}

function Alert() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="alert">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="alert">
          <path d={svgPaths.p13b48e80} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <Alert />
    </div>
  );
}

function OverlayBadge() {
  return (
    <div className="bg-[#1170cf] box-border content-stretch flex flex-col h-[16px] items-center justify-center min-w-[16px] px-[4px] py-0 relative rounded-[100px] shrink-0" data-name=".Overlay Badge">
      <div aria-hidden="true" className="absolute border border-black border-solid inset-[-1px] pointer-events-none rounded-[101px]" />
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[16px] whitespace-pre">1</p>
      </div>
    </div>
  );
}

function BaseIconButton4() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[6px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper4 />
      <OverlayBadge />
    </div>
  );
}

function SimpleButtonsIconButton4() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[36px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton4 />
    </div>
  );
}

function VerticalDivider1() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-px" data-name="Vertical Divider">
      <div className="basis-0 grow h-full min-h-px min-w-px shrink-0" data-name="Line" />
    </div>
  );
}

function UtilityButtons() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name=".Utility Buttons">
      <SimpleButtonsIconButton2 />
      <SimpleButtonsIconButton3 />
      <SimpleButtonsIconButton4 />
      <div className="flex flex-row items-center self-stretch">
        <VerticalDivider1 />
      </div>
    </div>
  );
}

function WaffleMenu() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="waffle-menu">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="waffle-menu">
          <path d={svgPaths.p1aaab100} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <WaffleMenu />
    </div>
  );
}

function BaseIconButton5() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[6px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper5 />
    </div>
  );
}

function SimpleButtonsIconButton5() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[36px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton5 />
    </div>
  );
}

function Layout() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[32px_32px]" data-name="Layout" style={{ maskImage: `url('${imgLayout}')` }}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(84, 84, 84, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <circle cx="16" cy="16" fill="var(--fill-0, #545454)" id="Solid Color" r="16" />
        </svg>
      </div>
      <img alt="" className="block max-w-none size-full" height="32" src={img} width="32" />
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="State"></g>
        </svg>
      </div>
    </div>
  );
}

function CoreAvatar() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center overflow-clip" data-name=".Core - Avatar">
      <Layout />
    </div>
  );
}

function BaseAvatar() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]" data-name=".Base - Avatar">
      <CoreAvatar />
    </div>
  );
}

function Avatar() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]" data-name="Avatar">
      <BaseAvatar />
    </div>
  );
}

function RightContent() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center justify-end min-h-px min-w-px relative shrink-0" data-name=".Right Content">
      <ProductButtons />
      <UtilityButtons />
      <SimpleButtonsIconButton5 />
      <Avatar />
    </div>
  );
}

function CoreAppHeader() {
  return (
    <div className="relative shrink-0 w-full" data-name=".Core - App Header">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between pl-[16px] pr-[24px] py-[12px] relative w-full">
          <LeftContent />
          <RightContent />
        </div>
      </div>
    </div>
  );
}

function AppHeader() {
  return (
    <div className="box-border content-stretch flex flex-col h-[64px] items-start px-0 py-[2px] relative shrink-0 w-full" data-name="App Header">
      <CoreAppHeader />
    </div>
  );
}

function CxStudioAppHeader() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name=".CX Studio App Header">
      <AppHeader />
    </div>
  );
}

function MarkerContainer() {
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

function BaseSideNavigationTab() {
  return (
    <div className="basis-0 bg-[rgba(255,255,255,0)] grow min-h-px min-w-px relative rounded-[20px] shrink-0" data-name=".Base - Side Navigation Tab">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <BotCustomerAssistant />
          <p className="basis-0 font-['Inter:medium',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)]">AI Agents</p>
        </div>
      </div>
    </div>
  );
}

function NavigationItem() {
  return (
    <div className="content-stretch flex gap-[16px] h-[40px] items-center relative shrink-0 w-full" data-name="Navigation Item">
      <MarkerContainer />
      <BaseSideNavigationTab />
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

function MarkerActiveSemi() {
  return <div className="bg-[rgba(255,255,255,0.95)] h-[16px] rounded-br-[4px] rounded-tr-[4px] shrink-0 w-[4px]" data-name="marker-active-semi2" />;
}

function MarkerContainer3() {
  return (
    <div className="content-stretch flex gap-[10px] h-full items-center relative shrink-0 w-[4px]" data-name="Marker Container">
      <MarkerActiveSemi />
    </div>
  );
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

function BaseSideNavigationTab2() {
  return (
    <div className="basis-0 bg-[rgba(255,255,255,0.2)] grow min-h-px min-w-px relative rounded-[20px] shrink-0" data-name=".Base - Side Navigation Tab">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center p-[8px] relative w-full">
          <MultilineChart />
          <p className="basis-0 font-['Inter:bold',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)]">Observability</p>
        </div>
      </div>
    </div>
  );
}

function NavigationItem2() {
  return (
    <div className="content-stretch flex gap-[16px] h-[40px] items-center relative shrink-0 w-full" data-name="Navigation Item">
      <MarkerContainer3 />
      <BaseSideNavigationTab2 />
    </div>
  );
}

function NavSectionPopoverStyle() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full" data-name=".Nav Section - Popover Style">
      <NavigationItem />
      <SideNavItemPopoverStyle />
      <NavigationItem1 />
      <NavigationItem2 />
    </div>
  );
}

function UpperSectionScrollable() {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px overflow-clip px-0 py-[16px] relative shrink-0 w-full" data-name="Upper Section (Scrollable)">
      <NavSectionPopoverStyle />
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

function SideNavigationPopover() {
  return (
    <div className="content-stretch flex flex-col h-[1016px] items-start relative shrink-0 w-[240px]" data-name="Side Navigation - Popover">
      <UpperSectionScrollable />
      <LowerSectionFixed />
    </div>
  );
}

function CxStudioSideNavigation() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 z-[2]" data-name="CX Studio Side Navigation">
      <SideNavigationPopover />
    </div>
  );
}

function MainContentArea() {
  return <div className="basis-0 content-stretch flex flex-col gap-[16px] grow h-full items-start min-h-px min-w-px shrink-0 z-[1]" data-name=".Main Content Area" />;
}

function MainLayout() {
  return (
    <div className="basis-0 content-stretch flex gap-[24px] grow isolate items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Main Layout">
      <CxStudioSideNavigation />
      <MainContentArea />
    </div>
  );
}

function CoreAppShell() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px overflow-clip relative shrink-0 w-full" data-name=".Core - App Shell">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute bg-black inset-0" />
        <img alt="" className="absolute max-w-none object-50%-50% object-cover opacity-90 size-full" src={imgCoreAppShell} />
      </div>
      <CxStudioAppHeader />
      <MainLayout />
    </div>
  );
}

function AppShell() {
  return (
    <div className="content-stretch flex flex-col h-[1080px] items-start relative shrink-0 w-[1920px]" data-name="App Shell">
      <CoreAppShell />
    </div>
  );
}

function CoreCxStudioAppShell() {
  return (
    <div className="bg-black content-stretch flex flex-col h-[1080px] items-start overflow-clip relative shrink-0 w-[1920px]" data-name=".Core - CX Studio App Shell">
      <AppShell />
    </div>
  );
}

function CxStudioAppShell() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[1920px]" data-name="CX Studio App Shell">
      <CoreCxStudioAppShell />
    </div>
  );
}

function AiAgentStudioAppShell() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-0 top-0" data-name="AI Agent Studio App Shell">
      <CxStudioAppShell />
    </div>
  );
}

export default function ObservabilityHomePage() {
  return (
    <div className="relative size-full" data-name="Observability Home page">
      <AiAgentStudioAppShell />
    </div>
  );
}