import svgPaths from "./svg-a9hcy74n3g";
import { imgLayout, imgLayout1 } from "./svg-kv7g3";

function Microphone() {
  return (
    <div className="relative shrink-0 size-[28px]" data-name="microphone">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 28">
        <g id="microphone">
          <path d={svgPaths.p28858080} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function IconWrapper() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Icon Wrapper">
      <Microphone />
    </div>
  );
}

function Layout() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[48px_48px]" data-name="Layout" style={{ maskImage: `url('${imgLayout}')` }}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(84, 84, 84, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
          <circle cx="24" cy="24" fill="var(--fill-0, #545454)" id="Solid Color" r="24" />
        </svg>
      </div>
      <IconWrapper />
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
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center overflow-clip" data-name="Core - Avatar">
      <Layout />
    </div>
  );
}

function BaseAvatar() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[48px]" data-name="Base - Avatar">
      <CoreAvatar />
    </div>
  );
}

function Avatar() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Avatar">
      <BaseAvatar />
    </div>
  );
}

function Copy() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="copy">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="copy">
          <path d={svgPaths.p2d68b080} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function OutdatedButtonIconWrapper() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Icon Wrapper">
      <Copy />
    </div>
  );
}

function OutdatedBaseIconButton() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[100px] shrink-0" data-name="⚠ OUTDATED Base - Icon Button">
      <OutdatedButtonIconWrapper />
    </div>
  );
}

function SimpleButtonsOutdatedIconButton() {
  return (
    <div className="content-stretch flex h-[24px] items-center justify-center relative rounded-[100px] shrink-0" data-name="Simple Buttons/⚠ OUTDATED Icon Button">
      <OutdatedBaseIconButton />
    </div>
  );
}

function Info() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Info">
      <div className="flex flex-col font-['Inter:bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[28px] whitespace-pre">Session ID: d1300703-5c5a-4221-9184-cd523422be12</p>
      </div>
      <SimpleButtonsOutdatedIconButton />
    </div>
  );
}

function Title() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start justify-center min-h-px min-w-px relative shrink-0" data-name="Title">
      <Info />
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] w-full">
        <p className="leading-[20px]">
          Consumer ID: 33d5d0e4-2b62-4693-a27b-5248f90115fd • Interaction ID: 9e6c5f3d-18c8-417c-a931-56d1ef0ef248<span>{` • `}</span>
          <span>
            Total Messages:1
            <br aria-hidden="true" />
            {`Last updated at: Jul 15 '25 5:50 AM`}
          </span>
        </p>
      </div>
    </div>
  );
}

function TitleInfo() {
  return (
    <div className="basis-0 content-stretch flex gap-[16px] grow h-full items-center min-h-px min-w-px relative shrink-0" data-name=".Title Info">
      <Avatar />
      <Title />
    </div>
  );
}

function LeftContent() {
  return (
    <div className="basis-0 content-stretch flex gap-[16px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Left Content">
      <div className="basis-0 flex flex-row grow items-center self-stretch shrink-0">
        <TitleInfo />
      </div>
    </div>
  );
}

function Refresh() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="refresh">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="refresh">
          <path d={svgPaths.p15fac180} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function OutdatedButtonIconWrapper1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Icon Wrapper">
      <Refresh />
    </div>
  );
}

function OutdatedBaseIconButton1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[2px] relative rounded-[100px] shrink-0" data-name="⚠ OUTDATED Base - Icon Button">
      <OutdatedButtonIconWrapper1 />
    </div>
  );
}

function SimpleButtonsOutdatedIconButton1() {
  return (
    <div className="bg-[rgba(0,0,0,0)] content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[20px]" data-name="Simple Buttons/⚠ OUTDATED Icon Button">
      <OutdatedBaseIconButton1 />
    </div>
  );
}

function Cancel() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="cancel">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="cancel">
          <path d={svgPaths.p10c1f700} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function OutdatedButtonIconWrapper2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Icon Wrapper">
      <Cancel />
    </div>
  );
}

function OutdatedBaseIconButton2() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[2px] relative rounded-[100px] shrink-0" data-name="⚠ OUTDATED Base - Icon Button">
      <OutdatedButtonIconWrapper2 />
    </div>
  );
}

function SimpleButtonsOutdatedIconButton2() {
  return (
    <div className="bg-[rgba(0,0,0,0)] content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[20px]" data-name="Simple Buttons/⚠ OUTDATED Icon Button">
      <OutdatedBaseIconButton2 />
    </div>
  );
}

function Toolbar() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="toolbar">
      <SimpleButtonsOutdatedIconButton1 />
      <SimpleButtonsOutdatedIconButton2 />
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="heading">
      <LeftContent />
      <Toolbar />
    </div>
  );
}

function Search() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="search">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="search">
          <path d={svgPaths.p36e6200} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingIcon() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[24px] shrink-0" data-name="Leading Icon">
      <Search />
    </div>
  );
}

function CoreInputContent() {
  return (
    <div className="box-border content-stretch flex h-[21px] items-center pl-0 pr-[2px] py-0 relative shrink-0" data-name=".Core - Input Content">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] mr-[-2px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Search</p>
    </div>
  );
}

function TextContent() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow h-[20px] items-center min-h-px min-w-px relative shrink-0" data-name="Text Content">
      <CoreInputContent />
    </div>
  );
}

function ContentWrapper() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow h-[21px] items-center min-h-px min-w-px relative shrink-0" data-name="Content Wrapper">
      <LeadingIcon />
      <TextContent />
    </div>
  );
}

function CoreInput() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-[8px] shrink-0 w-full" data-name=".Core - Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[6px] items-center pl-[12px] pr-[6px] py-[5.5px] relative w-full">
          <ContentWrapper />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function BaseTextField() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name=".Base - Text Field">
      <CoreInput />
    </div>
  );
}

function Input() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Input">
      <BaseTextField />
    </div>
  );
}

function SearchField() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[260px]" data-name="Search Field">
      <Input />
    </div>
  );
}

function SearchAndFilter() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-name="Search and Filter">
      <SearchField />
    </div>
  );
}

function Placeholder() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_106_87525)" id="placeholder">
          <path d={svgPaths.p1bb82900} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_106_87525">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function LabelChip() {
  return (
    <div className="bg-[#12283d] box-border content-center flex flex-wrap gap-[4px] items-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Label Chip">
      <div aria-hidden="true" className="absolute border border-[#5ebff7] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <Placeholder />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Label</p>
      </div>
    </div>
  );
}

function Search1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Search">
      <SearchAndFilter />
      <LabelChip />
    </div>
  );
}

function PerformingAction() {
  return (
    <div className="relative shrink-0 w-full" data-name=".Performing action">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[10px] items-center justify-center px-[10px] py-0 relative w-full">
          <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap">
            <p className="leading-[20px] whitespace-pre">Performing action “Collect_customer_info”</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionId() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name=".Transaction ID">
      <p className="font-['Inter:regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Transaction ID: 0000000xndhbxd0000000</p>
    </div>
  );
}

function Copy1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="copy">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="copy">
          <path d={svgPaths.p5f2f540} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Flag() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="flag">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="flag">
          <path d={svgPaths.p18719a00} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function WarningBadge() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="warning-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="warning-badge">
          <path d={svgPaths.p3445e580} fill="var(--fill-0, #F2990A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Badge() {
  return (
    <div className="bg-[#36220c] content-stretch flex flex-col items-center justify-center relative rounded-[100px] shrink-0 size-[14px]" data-name="Badge">
      <WarningBadge />
    </div>
  );
}

function Placeholder1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_106_87311)" id="placeholder">
          <path d={svgPaths.p225ff00} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_106_87311">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Action() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Action">
      <Copy1 />
      <Flag />
      <Badge />
      <Placeholder1 />
    </div>
  );
}

function TransacionId() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name=".Transacion ID">
      <TransactionId />
      <Action />
    </div>
  );
}

function Participant() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="participant">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="participant">
          <g id="Vector">
            <path d={svgPaths.p11e2ce00} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function IconWrapper1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Icon Wrapper">
      <Participant />
    </div>
  );
}

function Layout1() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[32px_32px]" data-name="Layout" style={{ maskImage: `url('${imgLayout1}')` }}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(84, 84, 84, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <circle cx="16" cy="16" fill="var(--fill-0, #545454)" id="Solid Color" r="16" />
        </svg>
      </div>
      <IconWrapper1 />
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="State"></g>
        </svg>
      </div>
    </div>
  );
}

function CoreAvatar1() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center overflow-clip" data-name=".Core - Avatar">
      <Layout1 />
    </div>
  );
}

function BaseAvatar1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]" data-name=".Base - Avatar">
      <CoreAvatar1 />
    </div>
  );
}

function Avatar1() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 size-[32px]" data-name="Avatar">
      <BaseAvatar1 />
    </div>
  );
}

function Avatar2() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-end pb-[24px] pt-0 px-0 relative self-stretch shrink-0" data-name="Avatar">
      <Avatar1 />
    </div>
  );
}

function BaseChat() {
  return (
    <div className="bg-black box-border content-stretch flex flex-col gap-[4px] items-start justify-end min-w-[120px] p-[12px] relative rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-[280px]" data-name=".Base - Chat">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-[-1px] pointer-events-none rounded-br-[17px] rounded-tl-[17px] rounded-tr-[17px]" />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] w-full">Greeting here, how may I help you?</p>
    </div>
  );
}

function ReceivedTime() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name=".Received Time">
      <p className="font-['Inter:regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">08:12 AM, Mar 11, 2025</p>
    </div>
  );
}

function Chat() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0" data-name="Chat">
      <BaseChat />
      <ReceivedTime />
    </div>
  );
}

function Copy2() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="copy">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="copy">
          <path d={svgPaths.p5f2f540} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Hide() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="hide">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="hide">
          <g id="Vector">
            <path d={svgPaths.p1345ba00} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.pe7c9800} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Placeholder2() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_106_87311)" id="placeholder">
          <path d={svgPaths.p225ff00} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_106_87311">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Action1() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center pb-[24px] pt-0 px-0 relative self-stretch shrink-0" data-name="Action">
      <Copy2 />
      <Hide />
      <Placeholder2 />
    </div>
  );
}

function Chat1() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Chat">
      <Avatar2 />
      <Chat />
      <Action1 />
    </div>
  );
}

function Chat2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Chat">
      <TransacionId />
      <Chat1 />
    </div>
  );
}

function Message() {
  return (
    <div className="relative shrink-0 w-full" data-name="Message">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[10px] py-0 relative w-full">
          <Chat2 />
        </div>
      </div>
    </div>
  );
}

function BaseChat1() {
  return (
    <div className="bg-[#1a1a1a] box-border content-stretch flex flex-col gap-[4px] items-start justify-end min-w-[120px] p-[12px] relative rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-[280px]" data-name=".Base - Chat">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-[-1px] pointer-events-none rounded-bl-[17px] rounded-tl-[17px] rounded-tr-[17px]" />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] w-full">Greeting here, how may I help you?</p>
    </div>
  );
}

function ReceivedTime1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name=".Received Time">
      <p className="font-['Inter:regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">08:12 AM, Mar 11, 2025</p>
    </div>
  );
}

function Chat3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0" data-name="Chat">
      <BaseChat1 />
      <ReceivedTime1 />
    </div>
  );
}

function BotCustomerAssistant() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="bot-customer-assistant">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="bot-customer-assistant">
          <g id="Vector">
            <path d={svgPaths.p3fdf3300} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p5755900} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1f76880} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p8805a80} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p6f8b980} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function IconWrapper2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Icon Wrapper">
      <BotCustomerAssistant />
    </div>
  );
}

function Layout2() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[32px_32px]" data-name="Layout" style={{ maskImage: `url('${imgLayout1}')` }}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(8, 89, 156, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <circle cx="16" cy="16" fill="var(--fill-0, #08599C)" id="Solid Color" r="16" />
        </svg>
      </div>
      <IconWrapper2 />
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="State"></g>
        </svg>
      </div>
    </div>
  );
}

function CoreAvatar2() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center overflow-clip" data-name=".Core - Avatar">
      <Layout2 />
    </div>
  );
}

function BaseAvatar2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]" data-name=".Base - Avatar">
      <CoreAvatar2 />
    </div>
  );
}

function Avatar3() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 size-[32px]" data-name="Avatar">
      <BaseAvatar2 />
    </div>
  );
}

function Avatar4() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-end pb-[24px] pt-0 px-0 relative self-stretch shrink-0" data-name="Avatar">
      <Avatar3 />
    </div>
  );
}

function Chat4() {
  return (
    <div className="content-stretch flex gap-[8px] items-start justify-end relative shrink-0" data-name="Chat">
      <Chat3 />
      <Avatar4 />
    </div>
  );
}

function Chat5() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Chat">
      <Chat4 />
    </div>
  );
}

function Message1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Message">
      <div className="flex flex-col items-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-end px-[10px] py-0 relative w-full">
          <Chat5 />
        </div>
      </div>
    </div>
  );
}

function Messages() {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px px-0 py-[4px] relative rounded-[8px] shrink-0" data-name="Messages">
      <Message />
      <Message1 />
    </div>
  );
}

function Session() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative shrink-0 w-full" data-name="Session">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[12px] items-start px-[12px] py-0 relative w-full">
          <Messages />
        </div>
      </div>
    </div>
  );
}

function Session1() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative rounded-[8px] shrink-0 w-full" data-name="Session">
      <Session />
    </div>
  );
}

function VerticalDivider() {
  return (
    <div className="relative self-stretch shrink-0 w-[2px]" data-name="Vertical Divider">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2 220">
        <g id="Vertical Divider">
          <path d="M1.00001 0L1 220" id="Vector 2" stroke="var(--stroke-0, white)" strokeOpacity="0.5" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function TransactionId1() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0" data-name=".Transaction ID">
      <p className="font-['Inter:regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Transaction ID: 0000000xndhbxd0000000</p>
    </div>
  );
}

function Copy3() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="copy">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="copy">
          <path d={svgPaths.p5f2f540} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Flag1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="flag">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="flag">
          <path d={svgPaths.p18719a00} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function WarningBadge1() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="warning-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="warning-badge">
          <path d={svgPaths.p3445e580} fill="var(--fill-0, #F2990A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Badge1() {
  return (
    <div className="bg-[#36220c] content-stretch flex flex-col items-center justify-center relative rounded-[100px] shrink-0 size-[14px]" data-name="Badge">
      <WarningBadge1 />
    </div>
  );
}

function Placeholder3() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_106_87311)" id="placeholder">
          <path d={svgPaths.p225ff00} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_106_87311">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Action2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Action">
      <Copy3 />
      <Flag1 />
      <Badge1 />
      <Placeholder3 />
    </div>
  );
}

function TransacionId1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name=".Transacion ID">
      <TransactionId1 />
      <Action2 />
    </div>
  );
}

function Participant1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="participant">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="participant">
          <g id="Vector">
            <path d={svgPaths.p11e2ce00} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function IconWrapper3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Icon Wrapper">
      <Participant1 />
    </div>
  );
}

function Layout3() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[32px_32px]" data-name="Layout" style={{ maskImage: `url('${imgLayout1}')` }}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(84, 84, 84, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <circle cx="16" cy="16" fill="var(--fill-0, #545454)" id="Solid Color" r="16" />
        </svg>
      </div>
      <IconWrapper3 />
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="State"></g>
        </svg>
      </div>
    </div>
  );
}

function CoreAvatar3() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center overflow-clip" data-name=".Core - Avatar">
      <Layout3 />
    </div>
  );
}

function BaseAvatar3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]" data-name=".Base - Avatar">
      <CoreAvatar3 />
    </div>
  );
}

function Avatar5() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 size-[32px]" data-name="Avatar">
      <BaseAvatar3 />
    </div>
  );
}

function Avatar6() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-end pb-[24px] pt-0 px-0 relative self-stretch shrink-0" data-name="Avatar">
      <Avatar5 />
    </div>
  );
}

function BaseChat2() {
  return (
    <div className="bg-black box-border content-stretch flex flex-col gap-[4px] items-start justify-end min-w-[120px] p-[12px] relative rounded-br-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-[280px]" data-name=".Base - Chat">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-[-1px] pointer-events-none rounded-br-[17px] rounded-tl-[17px] rounded-tr-[17px]" />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] w-full">Greeting here, how may I help you?</p>
    </div>
  );
}

function ReceivedTime2() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name=".Received Time">
      <p className="font-['Inter:regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">08:12 AM, Mar 11, 2025</p>
    </div>
  );
}

function Chat6() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0" data-name="Chat">
      <BaseChat2 />
      <ReceivedTime2 />
    </div>
  );
}

function Copy4() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="copy">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="copy">
          <path d={svgPaths.p5f2f540} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Hide1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="hide">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="hide">
          <g id="Vector">
            <path d={svgPaths.p1345ba00} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.pe7c9800} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Placeholder4() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_106_87311)" id="placeholder">
          <path d={svgPaths.p225ff00} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_106_87311">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Action3() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center pb-[24px] pt-0 px-0 relative self-stretch shrink-0" data-name="Action">
      <Copy4 />
      <Hide1 />
      <Placeholder4 />
    </div>
  );
}

function Chat7() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name="Chat">
      <Avatar6 />
      <Chat6 />
      <Action3 />
    </div>
  );
}

function Chat8() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Chat">
      <TransacionId1 />
      <Chat7 />
    </div>
  );
}

function Message2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Message">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-[10px] py-0 relative w-full">
          <Chat8 />
        </div>
      </div>
    </div>
  );
}

function BaseChat3() {
  return (
    <div className="bg-[#1a1a1a] box-border content-stretch flex flex-col gap-[4px] items-start justify-end min-w-[120px] p-[12px] relative rounded-bl-[16px] rounded-tl-[16px] rounded-tr-[16px] shrink-0 w-[280px]" data-name=".Base - Chat">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-[-1px] pointer-events-none rounded-bl-[17px] rounded-tl-[17px] rounded-tr-[17px]" />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] w-full">Greeting here, how may I help you?</p>
    </div>
  );
}

function ReceivedTime3() {
  return (
    <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name=".Received Time">
      <p className="font-['Inter:regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">08:12 AM, Mar 11, 2025</p>
    </div>
  );
}

function Chat9() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0" data-name="Chat">
      <BaseChat3 />
      <ReceivedTime3 />
    </div>
  );
}

function BotCustomerAssistant1() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="bot-customer-assistant">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="bot-customer-assistant">
          <g id="Vector">
            <path d={svgPaths.p3fdf3300} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p5755900} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1f76880} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p8805a80} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p6f8b980} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function IconWrapper4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Icon Wrapper">
      <BotCustomerAssistant1 />
    </div>
  );
}

function Layout4() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[32px_32px]" data-name="Layout" style={{ maskImage: `url('${imgLayout1}')` }}>
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(8, 89, 156, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <circle cx="16" cy="16" fill="var(--fill-0, #08599C)" id="Solid Color" r="16" />
        </svg>
      </div>
      <IconWrapper4 />
      <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
          <g id="State"></g>
        </svg>
      </div>
    </div>
  );
}

function CoreAvatar4() {
  return (
    <div className="absolute content-stretch flex flex-col inset-0 items-center justify-center overflow-clip" data-name=".Core - Avatar">
      <Layout4 />
    </div>
  );
}

function BaseAvatar4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[32px]" data-name=".Base - Avatar">
      <CoreAvatar4 />
    </div>
  );
}

function Avatar7() {
  return (
    <div className="content-stretch flex items-start justify-center relative shrink-0 size-[32px]" data-name="Avatar">
      <BaseAvatar4 />
    </div>
  );
}

function Avatar8() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-end pb-[24px] pt-0 px-0 relative self-stretch shrink-0" data-name="Avatar">
      <Avatar7 />
    </div>
  );
}

function Chat10() {
  return (
    <div className="content-stretch flex gap-[8px] items-start justify-end relative shrink-0" data-name="Chat">
      <Chat9 />
      <Avatar8 />
    </div>
  );
}

function Chat11() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0" data-name="Chat">
      <Chat10 />
    </div>
  );
}

function Message3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Message">
      <div className="flex flex-col items-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-end px-[10px] py-0 relative w-full">
          <Chat11 />
        </div>
      </div>
    </div>
  );
}

function Messages1() {
  return (
    <div className="basis-0 bg-[rgba(255,255,255,0.11)] box-border content-stretch flex flex-col gap-[12px] grow items-start min-h-px min-w-px px-0 py-[4px] relative rounded-[8px] shrink-0" data-name="Messages">
      <Message2 />
      <Message3 />
    </div>
  );
}

function Session2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Session">
      <div className="size-full">
        <div className="box-border content-stretch flex gap-[12px] items-start pl-0 pr-[12px] py-0 relative w-full">
          <VerticalDivider />
          <Messages1 />
        </div>
      </div>
    </div>
  );
}

function Session3() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative rounded-[8px] shrink-0 w-full" data-name="Session">
      <Session2 />
    </div>
  );
}

function Conversation() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[16px] grow h-full items-start min-h-px min-w-px overflow-clip relative shrink-0" data-name="Conversation">
      <Search1 />
      <PerformingAction />
      <Session1 />
      <Session3 />
      <Session1 />
      <Session1 />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[24px] whitespace-pre">Verify_account</p>
      </div>
    </div>
  );
}

function Title1() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Title">
      <Text />
    </div>
  );
}

function Download() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="download">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="download">
          <g id="Vector">
            <path d={svgPaths.p1413c7f0} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p1c105700} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function OutdatedButtonIconWrapper3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Icon Wrapper">
      <Download />
    </div>
  );
}

function OutdatedButtonLabel() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Label">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.95)] text-center text-nowrap whitespace-pre">Download</p>
    </div>
  );
}

function OutdatedButtonContent() {
  return (
    <div className="box-border content-stretch flex gap-[4px] h-[24px] items-center justify-center px-[10px] py-0 relative shrink-0" data-name="⚠ OUTDATED Button - Content">
      <OutdatedButtonIconWrapper3 />
      <OutdatedButtonLabel />
    </div>
  );
}

function OutdatedBasePillButton() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex items-center justify-center relative rounded-[20px] shrink-0" data-name="⚠ OUTDATED Base - Pill Button">
      <OutdatedButtonContent />
    </div>
  );
}

function SimpleButtonsOutdatedPillButton() {
  return (
    <div className="content-stretch flex h-[24px] items-start relative rounded-[20px] shrink-0" data-name="Simple Buttons/⚠ OUTDATED Pill Button">
      <OutdatedBasePillButton />
    </div>
  );
}

function ArrowUp() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-up">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-up">
          <path d={svgPaths.p38d3e940} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function OutdatedButtonIconWrapper4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Icon Wrapper">
      <ArrowUp />
    </div>
  );
}

function OutdatedButtonLabel1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Label">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.95)] text-center text-nowrap whitespace-pre">Collapse all</p>
    </div>
  );
}

function OutdatedButtonContent1() {
  return (
    <div className="box-border content-stretch flex gap-[4px] h-[24px] items-center justify-center px-[10px] py-0 relative shrink-0" data-name="⚠ OUTDATED Button - Content">
      <OutdatedButtonIconWrapper4 />
      <OutdatedButtonLabel1 />
    </div>
  );
}

function OutdatedBasePillButton1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex items-center justify-center relative rounded-[20px] shrink-0" data-name="⚠ OUTDATED Base - Pill Button">
      <OutdatedButtonContent1 />
    </div>
  );
}

function SimpleButtonsOutdatedPillButton1() {
  return (
    <div className="content-stretch flex h-[24px] items-start relative rounded-[20px] shrink-0" data-name="Simple Buttons/⚠ OUTDATED Pill Button">
      <OutdatedBasePillButton1 />
    </div>
  );
}

function BaseChildCardHeader() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name=".Base - Child Card Header">
      <Title1 />
      <SimpleButtonsOutdatedPillButton />
      <SimpleButtonsOutdatedPillButton1 />
    </div>
  );
}

function ContentLableAndPlaceholdaerAndChip() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name=".Content - Lable and Placeholdaer and Chip">
      <p className="-webkit-box basis-0 font-['Inter:bold',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)]">Slot filling</p>
    </div>
  );
}

function Text1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[20px] whitespace-pre">Article identified</p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <Text1 />
    </div>
  );
}

function ArrowDown() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p333e5200} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <ArrowDown />
    </div>
  );
}

function BaseIconButton() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper />
    </div>
  );
}

function IconButton() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[24px]" data-name="Icon Button">
      <BaseIconButton />
    </div>
  );
}

function BaseChildCardHeader1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name=".Base - Child Card Header">
      <Frame />
      <IconButton />
    </div>
  );
}

function InfoBadge() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="info-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="info-badge">
          <path d={svgPaths.p102b1100} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function OutdatedButtonIconWrapper5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="⚠ OUTDATED Button - Icon Wrapper">
      <InfoBadge />
    </div>
  );
}

function OutdatedBaseIconButton3() {
  return (
    <div className="bg-[rgba(255,255,255,0.07)] box-border content-stretch flex items-center justify-center p-[2px] relative rounded-[100px] shrink-0" data-name="⚠ OUTDATED Base - Icon Button">
      <OutdatedButtonIconWrapper5 />
    </div>
  );
}

function SimpleButtonsOutdatedIconButton3() {
  return (
    <div className="absolute content-stretch flex h-[20px] items-center justify-center left-0 rounded-[100px] top-0" data-name="Simple Buttons/⚠ OUTDATED Icon Button">
      <OutdatedBaseIconButton3 />
    </div>
  );
}

function TrailingElementContainer() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Trailing Element Container">
      <SimpleButtonsOutdatedIconButton3 />
    </div>
  );
}

function InputChip() {
  return (
    <div className="bg-neutral-800 relative rounded-[4px] w-full" data-name="Input Chip">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative w-full">
          <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
            <p className="leading-[20px] whitespace-pre">Partial match</p>
          </div>
          <TrailingElementContainer />
        </div>
      </div>
    </div>
  );
}

function Copy5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Copy">
      <p className="-webkit-box font-['Inter:regular',sans-serif] leading-[20px] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Not helpful: 0.33</p>
    </div>
  );
}

function ContentLabelAndPlaceholder() {
  return (
    <div className="content-stretch flex flex-col h-[20px] items-start justify-between relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy5 />
    </div>
  );
}

function Copy6() {
  return (
    <div className="content-stretch flex gap-[8px] items-end relative shrink-0 w-full" data-name="Copy">
      <p className="-webkit-box font-['Inter:regular',sans-serif] leading-[20px] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent: 0.3</p>
    </div>
  );
}

function ContentLabelAndPlaceholder1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy6 />
    </div>
  );
}

function CheckboxBox() {
  return (
    <div className="bg-[rgba(255,255,255,0.07)] content-stretch flex gap-[10px] items-start relative rounded-[2px] shrink-0 w-[16px]" data-name=".Checkbox Box">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[2px]" />
    </div>
  );
}

function CheckboxContainer() {
  return (
    <div className="box-border content-stretch flex gap-[10px] items-start px-0 py-[2px] relative shrink-0 w-[16px]" data-name="Checkbox Container">
      <CheckboxBox />
    </div>
  );
}

function CheckboxLabel() {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-name=".Checkbox Label">
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.4)] text-nowrap">
        <p className="leading-[20px] whitespace-pre">Agent handover</p>
      </div>
    </div>
  );
}

function LabelAndInfoButton() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Label and Info Button">
      <CheckboxLabel />
    </div>
  );
}

function Elements() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0" data-name="Elements">
      <LabelAndInfoButton />
    </div>
  );
}

function BaseCheckbox() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-name=".Base - Checkbox">
      <CheckboxContainer />
      <Elements />
    </div>
  );
}

function Checkbox() {
  return (
    <div className="content-stretch flex gap-[8px] items-start relative shrink-0 w-full" data-name="Checkbox">
      <BaseCheckbox />
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Content">
      <BaseChildCardHeader1 />
      <div className="flex h-[24.577px] items-center justify-center relative shrink-0 w-full" style={{ "--transform-inner-width": "420.984375", "--transform-inner-height": "23.984375" } as React.CSSProperties}>
        <div className="flex-none rotate-[0.079deg] w-full">
          <InputChip />
        </div>
      </div>
      <ContentLabelAndPlaceholder />
      <ContentLabelAndPlaceholder1 />
      <Checkbox />
    </div>
  );
}

function ChildCard() {
  return (
    <div className="bg-[rgba(255,255,255,0.11)] relative rounded-[8px] shrink-0 w-full" data-name=".Child Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[10px] relative w-full">
          <Content />
        </div>
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[20px] whitespace-pre">Birthday</p>
      </div>
    </div>
  );
}

function BaseChip() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">May 1, 1980</p>
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Label">
      <BaseChip />
    </div>
  );
}

function Frame1() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <Text2 />
      <Label />
    </div>
  );
}

function ArrowDown1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p333e5200} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <ArrowDown1 />
    </div>
  );
}

function BaseIconButton1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper1 />
    </div>
  );
}

function IconButton1() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[24px]" data-name="Icon Button">
      <BaseIconButton1 />
    </div>
  );
}

function BaseChildCardHeader2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name=".Base - Child Card Header">
      <Frame1 />
      <IconButton1 />
    </div>
  );
}

function Copy7() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Copy">
      <ul className="-webkit-box [white-space-collapse:collapse] font-['Inter:regular',sans-serif] leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <li className="ms-[21px]">
          <span className="leading-[20px]">Required: true</span>
        </li>
      </ul>
    </div>
  );
}

function ContentLabelAndPlaceholder2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy7 />
    </div>
  );
}

function Copy8() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Copy">
      <ul className="-webkit-box [white-space-collapse:collapse] font-['Inter:regular',sans-serif] leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <li className="ms-[21px]">
          <span className="leading-[20px]">Entity type: date</span>
        </li>
      </ul>
    </div>
  );
}

function ContentLabelAndPlaceholder3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy8 />
    </div>
  );
}

function Copy9() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Copy">
      <ul className="-webkit-box [white-space-collapse:collapse] font-['Inter:regular',sans-serif] leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <li className="ms-[21px]">
          <span className="leading-[20px]">Entity description: birthday</span>
        </li>
      </ul>
    </div>
  );
}

function ContentLabelAndPlaceholder4() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy9 />
    </div>
  );
}

function Content1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Content">
      <BaseChildCardHeader2 />
      <ContentLabelAndPlaceholder2 />
      <ContentLabelAndPlaceholder3 />
      <ContentLabelAndPlaceholder4 />
    </div>
  );
}

function ChildCard1() {
  return (
    <div className="bg-[rgba(255,255,255,0.11)] relative rounded-[8px] shrink-0 w-full" data-name=".Child Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[10px] relative w-full">
          <Content1 />
        </div>
      </div>
    </div>
  );
}

function BaseChip1() {
  return (
    <div className="bg-[#0e2b20] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#3cc29a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Success (4.1)s</p>
      </div>
    </div>
  );
}

function AlertChip() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip1 />
    </div>
  );
}

function ChipAiAgentSession() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Chip/AI agent/Session">
      <AlertChip />
    </div>
  );
}

function ContentLableAndPlaceholdaerAndChip1() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name=".Content - Lable and Placeholdaer and Chip">
      <p className="-webkit-box basis-0 font-['Inter:bold',sans-serif] grow leading-[20px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)]">Fullfillment</p>
      <ChipAiAgentSession />
    </div>
  );
}

function Text3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[24px] whitespace-pre">Service and flow info</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <Text3 />
    </div>
  );
}

function ArrowDown2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p333e5200} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <ArrowDown2 />
    </div>
  );
}

function BaseIconButton2() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper2 />
    </div>
  );
}

function IconButton2() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[24px]" data-name="Icon Button">
      <BaseIconButton2 />
    </div>
  );
}

function BaseChildCardHeader3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name=".Base - Child Card Header">
      <Frame2 />
      <IconButton2 />
    </div>
  );
}

function Copy10() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Copy">
      <ul className="-webkit-box [white-space-collapse:collapse] font-['Inter:regular',sans-serif] leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <li className="ms-[21px]">
          <span className="leading-[20px]">Copy</span>
        </li>
      </ul>
    </div>
  );
}

function ContentLabelAndPlaceholder5() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy10 />
    </div>
  );
}

function Content2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Content">
      <BaseChildCardHeader3 />
      {[...Array(2).keys()].map((_, i) => (
        <ContentLabelAndPlaceholder5 key={i} />
      ))}
    </div>
  );
}

function ChildCard2() {
  return (
    <div className="bg-[rgba(255,255,255,0.11)] relative rounded-[8px] shrink-0 w-full" data-name=".Child Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[10px] relative w-full">
          <Content2 />
        </div>
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[24px] whitespace-pre">Fullfilment output</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <Text4 />
    </div>
  );
}

function ArrowDown3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="arrow-down">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="arrow-down">
          <path d={svgPaths.p333e5200} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <ArrowDown3 />
    </div>
  );
}

function BaseIconButton3() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[4px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper3 />
    </div>
  );
}

function IconButton3() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[24px]" data-name="Icon Button">
      <BaseIconButton3 />
    </div>
  );
}

function BaseChildCardHeader4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name=".Base - Child Card Header">
      <Frame3 />
      <IconButton3 />
    </div>
  );
}

function PopOut() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="pop-out">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="pop-out">
          <g id="Vector">
            <path d={svgPaths.pb3bc280} fill="#64B4FA" />
            <path d={svgPaths.p27d00600} fill="#64B4FA" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function StandaloneLink() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[#64b4fa] text-[12px] text-nowrap whitespace-pre">View transaction</p>
      <PopOut />
    </div>
  );
}

function Copy11() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Copy">
      <ul className="-webkit-box [white-space-collapse:collapse] font-['Inter:regular',sans-serif] leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <li className="ms-[21px]">
          <span className="leading-[20px]">Transaction ID: 12345678</span>
        </li>
      </ul>
      <div className="flex h-[16.152px] items-center justify-center relative shrink-0 w-[111.022px]" style={{ "--transform-inner-width": "103.78125", "--transform-inner-height": "15.984375" } as React.CSSProperties}>
        <div className="flex-none rotate-[0.079deg]">
          <StandaloneLink />
        </div>
      </div>
    </div>
  );
}

function ContentLabelAndPlaceholder6() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy11 />
    </div>
  );
}

function Copy12() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Copy">
      <ul className="-webkit-box [white-space-collapse:collapse] font-['Inter:regular',sans-serif] leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <li className="ms-[21px]">
          <span className="leading-[20px]">Size: 1.5 MB</span>
        </li>
      </ul>
    </div>
  );
}

function ContentLabelAndPlaceholder7() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0 w-full" data-name=".Content - Label and Placeholder">
      <Copy12 />
    </div>
  );
}

function Code() {
  return (
    <div className="bg-black h-[132px] relative shrink-0 w-full" data-name="Code">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col h-[132px] items-start p-[16px] relative w-full">
          <div className="font-['Roboto_Mono:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] w-full whitespace-pre-wrap">
            <p className="mb-0">{`[ 	`}</p>
            <p className="mb-0">{` { 		"id": "0001",`}</p>
            <p className="mb-0">{`     "type": "donut",`}</p>
            <p className="mb-0">{`     "name": "Cake",`}</p>
            <p>{`     "ppu": 0.55, 		`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeSnippet() {
  return (
    <div className="basis-0 grow h-[132px] min-h-px min-w-px relative rounded-[6px] shrink-0" data-name=".Code Snippet">
      <div className="content-stretch flex flex-col h-[132px] items-start overflow-clip relative rounded-[inherit] w-full">
        <Code />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Code1() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Code">
      <div className="flex h-[20.097px] items-center justify-center relative shrink-0 w-[71.027px]" style={{ "--transform-inner-width": "66.90625", "--transform-inner-height": "20" } as React.CSSProperties}>
        <div className="flex-none rotate-[0.079deg]">
          <ul className="-webkit-box [white-space-collapse:collapse] font-['Inter:regular',sans-serif] leading-[0] not-italic overflow-ellipsis overflow-hidden relative text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
            <li className="ms-[21px]">
              <span className="leading-[20px]">Output:</span>
            </li>
          </ul>
        </div>
      </div>
      <CodeSnippet />
    </div>
  );
}

function Content3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="Content">
      <BaseChildCardHeader4 />
      <ContentLabelAndPlaceholder6 />
      <ContentLabelAndPlaceholder7 />
      <Code1 />
    </div>
  );
}

function ChildCard3() {
  return (
    <div className="bg-[rgba(255,255,255,0.11)] relative rounded-[8px] shrink-0 w-full" data-name=".Child Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[10px] items-start p-[10px] relative w-full">
          <Content3 />
        </div>
      </div>
    </div>
  );
}

function Card() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] box-border content-stretch flex flex-col gap-[12px] h-full items-start p-[16px] relative rounded-[8px] shrink-0 w-[473px]" data-name="Card">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.11)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <BaseChildCardHeader />
      <ContentLableAndPlaceholdaerAndChip />
      <ChildCard />
      <ChildCard1 />
      <ContentLableAndPlaceholdaerAndChip1 />
      <ChildCard2 />
      <ChildCard3 />
    </div>
  );
}

function Content4() {
  return (
    <div className="basis-0 content-stretch flex gap-[16px] grow items-start justify-end min-h-px min-w-px relative shrink-0 w-full" data-name="Content">
      <Conversation />
      <Card />
    </div>
  );
}

function Body() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[20px] grow items-start min-h-px min-w-px relative shrink-0 w-full" data-name="Body">
      <Content4 />
    </div>
  );
}

function Body1() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[20px] grow items-start min-h-px min-w-px relative rounded-[12px] shrink-0 w-full" data-name="Body">
      <Body />
    </div>
  );
}

function ContentAreaChat() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow h-full items-start min-h-px min-w-px relative shrink-0" data-name=".Content Area/Chat">
      <Body1 />
    </div>
  );
}

function Layout5() {
  return (
    <div className="content-stretch flex gap-[8px] h-[648px] items-start overflow-clip relative shrink-0 w-full" data-name="Layout">
      <ContentAreaChat />
    </div>
  );
}

export default function BaseDialog() {
  return (
    <div className="bg-black relative rounded-[8px] size-full" data-name=".Base - Dialog">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_6px_24px_0px_rgba(0,0,0,0.25)]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start p-[16px] relative size-full">
          <Heading />
          <Layout5 />
        </div>
      </div>
    </div>
  );
}