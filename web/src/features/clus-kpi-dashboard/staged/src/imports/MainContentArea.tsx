import svgPaths from "./svg-v8c1sdgd7u";

function Info() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="Info">
      <div className="flex flex-col font-['Inter:bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[32px] whitespace-pre">Observability</p>
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start justify-center min-h-px min-w-px relative shrink-0" data-name="Title">
      <Info />
      <div className="flex flex-col font-['Inter:medium',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] w-full">
        <p className="leading-[20px]">Review your agent’s performance and quality</p>
      </div>
    </div>
  );
}

function TitleInfo() {
  return (
    <div className="basis-0 content-stretch flex gap-[16px] grow h-full items-center min-h-px min-w-px relative shrink-0" data-name=".Title Info">
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

function TitleAndActions() {
  return (
    <div className="content-stretch flex gap-[48px] items-center relative shrink-0 w-full" data-name=".Title and Actions">
      <LeftContent />
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
      <p className="font-['Inter:regular',sans-serif] leading-[20px] mr-[-2px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Search for an agent</p>
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
    <div className="basis-0 content-stretch flex gap-[6px] grow h-[21px] items-center min-h-px min-w-px relative shrink-0" data-name="Content Wrapper">
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
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[400px]" data-name="Search Field">
      <Input />
    </div>
  );
}

function Filter() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="filter">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="filter">
          <g id="Vector">
            <path d={svgPaths.p183c4100} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p18419480} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p17448a00} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function LeadingIcon1() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[24px] shrink-0" data-name="Leading Icon">
      <Filter />
    </div>
  );
}

function CoreInputContent1() {
  return (
    <div className="box-border content-stretch flex h-[21px] items-center pl-0 pr-[2px] py-0 relative shrink-0" data-name=".Core - Input Content">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] mr-[-2px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Agent type</p>
    </div>
  );
}

function TextContent1() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow h-[20px] items-center min-h-px min-w-px relative shrink-0" data-name="Text Content">
      <CoreInputContent1 />
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

function TrailingIcon() {
  return (
    <div className="box-border content-stretch flex items-center justify-center p-[2px] relative shrink-0" data-name="Trailing Icon">
      <ArrowDown />
    </div>
  );
}

function ContentWrapper1() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow h-[21px] items-center min-h-px min-w-px relative shrink-0" data-name="Content Wrapper">
      <LeadingIcon1 />
      <TextContent1 />
      <TrailingIcon />
    </div>
  );
}

function CoreInput1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-[8px] shrink-0 w-full" data-name=".Core - Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[6px] items-center pl-[12px] pr-[6px] py-[5.5px] relative w-full">
          <ContentWrapper1 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function BaseTextField1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name=".Base - Text Field">
      <CoreInput1 />
    </div>
  );
}

function BaseSelect() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name=".Base - Select">
      <BaseTextField1 />
    </div>
  );
}

function Select() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Select">
      <BaseSelect />
    </div>
  );
}

function Filter1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[180px]" data-name="Filter">
      <Select />
    </div>
  );
}

function Filter2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="filter">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="filter">
          <g id="Vector">
            <path d={svgPaths.p183c4100} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p18419480} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p17448a00} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function LeadingIcon2() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[24px] shrink-0" data-name="Leading Icon">
      <Filter2 />
    </div>
  );
}

function CoreInputContent2() {
  return (
    <div className="box-border content-stretch flex h-[21px] items-center pl-0 pr-[2px] py-0 relative shrink-0" data-name=".Core - Input Content">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] mr-[-2px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Last 24 hours</p>
    </div>
  );
}

function TextContent2() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow h-[20px] items-center min-h-px min-w-px relative shrink-0" data-name="Text Content">
      <CoreInputContent2 />
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

function TrailingIcon1() {
  return (
    <div className="box-border content-stretch flex items-center justify-center p-[2px] relative shrink-0" data-name="Trailing Icon">
      <ArrowDown1 />
    </div>
  );
}

function ContentWrapper2() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow h-[21px] items-center min-h-px min-w-px relative shrink-0" data-name="Content Wrapper">
      <LeadingIcon2 />
      <TextContent2 />
      <TrailingIcon1 />
    </div>
  );
}

function CoreInput2() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-[8px] shrink-0 w-full" data-name=".Core - Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[6px] items-center pl-[12px] pr-[6px] py-[5.5px] relative w-full">
          <ContentWrapper2 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function BaseTextField2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name=".Base - Text Field">
      <CoreInput2 />
    </div>
  );
}

function BaseSelect1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name=".Base - Select">
      <BaseTextField2 />
    </div>
  );
}

function Select1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Select">
      <BaseSelect1 />
    </div>
  );
}

function Filter3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[180px]" data-name="Filter">
      <Select1 />
    </div>
  );
}

function AudioBroadcast() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="audio-broadcast">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="audio-broadcast">
          <g id="Vector">
            <path d={svgPaths.p3e918280} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p376300} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.pc612580} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p2c9efd00} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.pd51e900} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function SimpleButtonsSelectablePillButton() {
  return (
    <div className="bg-[rgba(255,255,255,0.2)] box-border content-stretch flex gap-[6px] h-full items-center px-[12px] py-[7px] relative rounded-bl-[100px] rounded-tl-[100px] shrink-0" data-name="Simple Buttons/Selectable/Pill Button">
      <AudioBroadcast />
      <p className="font-['Inter:medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[16px] text-[rgba(255,255,255,0.95)] text-center text-nowrap whitespace-pre">Live</p>
    </div>
  );
}

function VerticalDivider() {
  return (
    <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-px" data-name="Vertical Divider">
      <div className="basis-0 bg-[rgba(255,255,255,0.2)] grow h-full min-h-px min-w-px shrink-0" data-name="Line" />
    </div>
  );
}

function TestTube() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="test-tube">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="test-tube">
          <g id="Vector">
            <path d={svgPaths.p27eceb00} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function SimpleButtonsSelectablePillButton1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex gap-[6px] h-full items-center px-[12px] py-[7px] relative rounded-br-[100px] rounded-tr-[100px] shrink-0" data-name="Simple Buttons/Selectable/Pill Button">
      <TestTube />
      <p className="font-['Inter:medium',sans-serif] leading-[24px] not-italic relative shrink-0 text-[16px] text-[rgba(255,255,255,0.95)] text-center text-nowrap whitespace-pre">Testing</p>
    </div>
  );
}

function ButtonGroupIconGroup() {
  return (
    <div className="box-border content-stretch flex h-[32px] items-center justify-center p-px relative rounded-[100px] shrink-0" data-name="Button Group/Icon Group">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[100px]" />
      <SimpleButtonsSelectablePillButton />
      <VerticalDivider />
      <SimpleButtonsSelectablePillButton1 />
    </div>
  );
}

function SplitIconButtonUnmute() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Split Icon Button/Unmute">
      <ButtonGroupIconGroup />
    </div>
  );
}

function Filters() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0" data-name="Filters">
      <SearchField />
      <Filter1 />
      <Filter3 />
      <SplitIconButtonUnmute />
    </div>
  );
}

function FilterBar() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name=".Filter Bar">
      <Filters />
    </div>
  );
}

function Header() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start justify-center relative shrink-0 w-full" data-name="Header">
      <TitleAndActions />
      <FilterBar />
    </div>
  );
}

function InfoCircle() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="info-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="info-circle">
          <g id="Vector">
            <path d={svgPaths.p33be3440} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p185acc80} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p1a144200} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <InfoCircle />
    </div>
  );
}

function BaseIconButton() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[2px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper />
    </div>
  );
}

function SimpleButtonsIconButton() {
  return (
    <div className="content-stretch flex h-[20px] items-center justify-center relative rounded-[100px] shrink-0" data-name="Simple Buttons/Icon Button">
      <BaseIconButton />
    </div>
  );
}

function CardHeader() {
  return (
    <div className="content-stretch flex gap-[4px] items-end relative shrink-0" data-name="Card Header">
      <p className="font-['Inter:medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">KPI Heading</p>
      <SimpleButtonsIconButton />
    </div>
  );
}

function Trending() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="trending">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="trending">
          <path d={svgPaths.p190b7d00} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TrendingUp() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Trending Up">
      <Trending />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3cc29a] text-[14px] text-nowrap whitespace-pre">+##%</p>
    </div>
  );
}

function KpiBody() {
  return (
    <div className="content-stretch flex gap-[8px] h-[40px] items-center relative shrink-0" data-name=".KPI Body">
      <p className="font-['Inter:medium',sans-serif] leading-[40px] not-italic relative shrink-0 text-[32px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">123K</p>
      <TrendingUp />
    </div>
  );
}

function FilterChip() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Filter Chip">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Label</p>
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_424752)" id="placeholder">
          <path d={svgPaths.p1bb82900} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_1_424752">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function KpiFooter() {
  return (
    <div className="content-stretch flex gap-[8px] h-[24px] items-center relative shrink-0" data-name=".KPI Footer">
      <FilterChip />
      <Placeholder />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Insight</p>
    </div>
  );
}

function MainContent() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
          <CardHeader />
          <KpiBody />
          <KpiFooter />
        </div>
      </div>
    </div>
  );
}

function KpiCardMomentumGlass() {
  return (
    <div className="basis-0 bg-gradient-to-r from-[rgba(255,255,255,0.05)] grow h-[148px] min-h-px min-w-px relative rounded-[8px] shrink-0 to-[rgba(255,255,255,0.05)]" data-name="KPI Card - Momentum Glass" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 387 148\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'0.10999999940395355\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(-2.2052e-15 12.715 -33.249 -6.5313e-8 193.96 -2.0845)\\\'><stop stop-color=\\\'rgba(255,255,255,0.4)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(255,255,255,0.05)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="content-stretch flex h-[148px] items-start overflow-clip relative rounded-[inherit] w-full">
        <MainContent />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.11)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function InfoCircle1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="info-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="info-circle">
          <g id="Vector">
            <path d={svgPaths.p33be3440} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p185acc80} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p1a144200} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <InfoCircle1 />
    </div>
  );
}

function BaseIconButton1() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[2px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper1 />
    </div>
  );
}

function SimpleButtonsIconButton1() {
  return (
    <div className="content-stretch flex h-[20px] items-center justify-center relative rounded-[100px] shrink-0" data-name="Simple Buttons/Icon Button">
      <BaseIconButton1 />
    </div>
  );
}

function CardHeader1() {
  return (
    <div className="content-stretch flex gap-[4px] items-end relative shrink-0" data-name="Card Header">
      <p className="font-['Inter:medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">latency</p>
      <SimpleButtonsIconButton1 />
    </div>
  );
}

function Trending1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="trending">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="trending">
          <path d={svgPaths.p190b7d00} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TrendingUp1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Trending Up">
      <Trending1 />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3cc29a] text-[14px] text-nowrap whitespace-pre">+##%</p>
    </div>
  );
}

function KpiBody1() {
  return (
    <div className="content-stretch flex gap-[8px] h-[40px] items-center relative shrink-0" data-name=".KPI Body">
      <p className="font-['Inter:medium',sans-serif] leading-[40px] not-italic relative shrink-0 text-[32px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">123K</p>
      <TrendingUp1 />
    </div>
  );
}

function FilterChip1() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Filter Chip">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Label</p>
      </div>
    </div>
  );
}

function Placeholder1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_424752)" id="placeholder">
          <path d={svgPaths.p1bb82900} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_1_424752">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function KpiFooter1() {
  return (
    <div className="content-stretch flex gap-[8px] h-[24px] items-center relative shrink-0" data-name=".KPI Footer">
      <FilterChip1 />
      <Placeholder1 />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Insight</p>
    </div>
  );
}

function MainContent1() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
          <CardHeader1 />
          <KpiBody1 />
          <KpiFooter1 />
        </div>
      </div>
    </div>
  );
}

function KpiCardMomentumGlass1() {
  return (
    <div className="basis-0 bg-gradient-to-r from-[rgba(255,255,255,0.05)] grow h-[148px] min-h-px min-w-px relative rounded-[8px] shrink-0 to-[rgba(255,255,255,0.05)]" data-name="KPI Card - Momentum Glass" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 387 148\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'0.10999999940395355\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(-2.2052e-15 12.715 -33.249 -6.5313e-8 193.96 -2.0845)\\\'><stop stop-color=\\\'rgba(255,255,255,0.4)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(255,255,255,0.05)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="content-stretch flex h-[148px] items-start overflow-clip relative rounded-[inherit] w-full">
        <MainContent1 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.11)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function InfoCircle2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="info-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="info-circle">
          <g id="Vector">
            <path d={svgPaths.p33be3440} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p185acc80} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p1a144200} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <InfoCircle2 />
    </div>
  );
}

function BaseIconButton2() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[2px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper2 />
    </div>
  );
}

function SimpleButtonsIconButton2() {
  return (
    <div className="content-stretch flex h-[20px] items-center justify-center relative rounded-[100px] shrink-0" data-name="Simple Buttons/Icon Button">
      <BaseIconButton2 />
    </div>
  );
}

function CardHeader2() {
  return (
    <div className="content-stretch flex gap-[4px] items-end relative shrink-0" data-name="Card Header">
      <p className="font-['Inter:medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Hallucination</p>
      <SimpleButtonsIconButton2 />
    </div>
  );
}

function Trending2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="trending">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="trending">
          <path d={svgPaths.p190b7d00} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TrendingUp2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Trending Up">
      <Trending2 />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3cc29a] text-[14px] text-nowrap whitespace-pre">+##%</p>
    </div>
  );
}

function KpiBody2() {
  return (
    <div className="content-stretch flex gap-[8px] h-[40px] items-center relative shrink-0" data-name=".KPI Body">
      <p className="font-['Inter:medium',sans-serif] leading-[40px] not-italic relative shrink-0 text-[32px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">123K</p>
      <TrendingUp2 />
    </div>
  );
}

function FilterChip2() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Filter Chip">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Label</p>
      </div>
    </div>
  );
}

function Placeholder2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_424752)" id="placeholder">
          <path d={svgPaths.p1bb82900} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_1_424752">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function KpiFooter2() {
  return (
    <div className="content-stretch flex gap-[8px] h-[24px] items-center relative shrink-0" data-name=".KPI Footer">
      <FilterChip2 />
      <Placeholder2 />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Insight</p>
    </div>
  );
}

function MainContent2() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
          <CardHeader2 />
          <KpiBody2 />
          <KpiFooter2 />
        </div>
      </div>
    </div>
  );
}

function KpiCardMomentumGlass2() {
  return (
    <div className="basis-0 bg-gradient-to-r from-[rgba(255,255,255,0.05)] grow h-[148px] min-h-px min-w-px relative rounded-[8px] shrink-0 to-[rgba(255,255,255,0.05)]" data-name="KPI Card - Momentum Glass" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 387 148\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'0.10999999940395355\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(-2.2052e-15 12.715 -33.249 -6.5313e-8 193.96 -2.0845)\\\'><stop stop-color=\\\'rgba(255,255,255,0.4)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(255,255,255,0.05)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="content-stretch flex h-[148px] items-start overflow-clip relative rounded-[inherit] w-full">
        <MainContent2 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.11)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Row() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Row">
      <KpiCardMomentumGlass />
      <KpiCardMomentumGlass1 />
      <KpiCardMomentumGlass2 />
      <KpiCardMomentumGlass />
    </div>
  );
}

function InfoCircle3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="info-circle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="info-circle">
          <g id="Vector">
            <path d={svgPaths.p33be3440} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p185acc80} fill="var(--fill-0, white)" fillOpacity="0.95" />
            <path d={svgPaths.p1a144200} fill="var(--fill-0, white)" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <InfoCircle3 />
    </div>
  );
}

function BaseIconButton3() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[2px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper3 />
    </div>
  );
}

function SimpleButtonsIconButton3() {
  return (
    <div className="content-stretch flex h-[20px] items-center justify-center relative rounded-[100px] shrink-0" data-name="Simple Buttons/Icon Button">
      <BaseIconButton3 />
    </div>
  );
}

function CardHeader3() {
  return (
    <div className="content-stretch flex gap-[4px] items-end relative shrink-0" data-name="Card Header">
      <p className="font-['Inter:medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">KPI Heading</p>
      <SimpleButtonsIconButton3 />
    </div>
  );
}

function Trending3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="trending">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="trending">
          <path d={svgPaths.p190b7d00} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function TrendingUp3() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Trending Up">
      <Trending3 />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3cc29a] text-[14px] text-nowrap whitespace-pre">+##%</p>
    </div>
  );
}

function KpiBody3() {
  return (
    <div className="content-stretch flex gap-[8px] h-[40px] items-center relative shrink-0" data-name=".KPI Body">
      <p className="font-['Inter:medium',sans-serif] leading-[40px] not-italic relative shrink-0 text-[32px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">123K</p>
      <TrendingUp3 />
    </div>
  );
}

function FilterChip3() {
  return (
    <div className="bg-neutral-800 box-border content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Filter Chip">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Label</p>
      </div>
    </div>
  );
}

function Placeholder3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="placeholder">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_424752)" id="placeholder">
          <path d={svgPaths.p1bb82900} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector" />
        </g>
        <defs>
          <clipPath id="clip0_1_424752">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function KpiFooter3() {
  return (
    <div className="content-stretch flex gap-[8px] h-[24px] items-center relative shrink-0" data-name=".KPI Footer">
      <FilterChip3 />
      <Placeholder3 />
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Insight</p>
    </div>
  );
}

function MainContent3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Main Content">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start px-[24px] py-[16px] relative w-full">
          <CardHeader3 />
          <KpiBody3 />
          <KpiFooter3 />
        </div>
      </div>
    </div>
  );
}

function KpiCardMomentumGlass3() {
  return (
    <div className="basis-0 bg-gradient-to-r from-[rgba(255,255,255,0.05)] grow h-[148px] min-h-px min-w-px relative rounded-[8px] shrink-0 to-[rgba(255,255,255,0.05)]" data-name="KPI Card - Momentum Glass" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\\'0 0 387 148\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\' preserveAspectRatio=\\\'none\\\'><rect x=\\\'0\\\' y=\\\'0\\\' height=\\\'100%\\\' width=\\\'100%\\\' fill=\\\'url(%23grad)\\\' opacity=\\\'0.10999999940395355\\\'/><defs><radialGradient id=\\\'grad\\\' gradientUnits=\\\'userSpaceOnUse\\\' cx=\\\'0\\\' cy=\\\'0\\\' r=\\\'10\\\' gradientTransform=\\\'matrix(-2.2052e-15 12.715 -33.249 -6.5313e-8 193.96 -2.0845)\\\'><stop stop-color=\\\'rgba(255,255,255,0.4)\\\' offset=\\\'0\\\'/><stop stop-color=\\\'rgba(255,255,255,0.05)\\\' offset=\\\'1\\\'/></radialGradient></defs></svg>')" }}>
      <div className="content-stretch flex h-[148px] items-start overflow-clip relative rounded-[inherit] w-full">
        <MainContent3 />
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.11)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Row1() {
  return (
    <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-name="Row">
      {[...Array(4).keys()].map((_, i) => (
        <KpiCardMomentumGlass3 key={i} />
      ))}
    </div>
  );
}

function CardsOnly() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Cards only">
      <Row />
      <Row1 />
    </div>
  );
}

function InfoBadge() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="info-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="info-badge">
          <path d={svgPaths.p102b1100} fill="var(--fill-0, white)" fillOpacity="0.7" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Label">
      <div className="flex flex-col font-['Inter:bold',sans-serif] justify-center leading-[0] not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap">
        <p className="leading-[20px] overflow-ellipsis overflow-hidden whitespace-pre">Agent overview</p>
      </div>
      <InfoBadge />
    </div>
  );
}

function Header1() {
  return (
    <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full" data-name="Header">
      <Label />
    </div>
  );
}

function Text() {
  return (
    <div className="basis-0 box-border content-stretch flex flex-col gap-[4px] grow items-start min-h-px min-w-px pb-[4px] pt-0 px-0 relative shrink-0" data-name="Text">
      <Header1 />
    </div>
  );
}

function Search1() {
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

function LeadingIcon3() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[24px] shrink-0" data-name="Leading Icon">
      <Search1 />
    </div>
  );
}

function CoreInputContent3() {
  return (
    <div className="box-border content-stretch flex h-[21px] items-center pl-0 pr-[2px] py-0 relative shrink-0" data-name=".Core - Input Content">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] mr-[-2px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Search</p>
    </div>
  );
}

function TextContent3() {
  return (
    <div className="basis-0 content-stretch flex gap-[4px] grow h-[20px] items-center min-h-px min-w-px relative shrink-0" data-name="Text Content">
      <CoreInputContent3 />
    </div>
  );
}

function ContentWrapper3() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow h-[21px] items-center min-h-px min-w-px relative shrink-0" data-name="Content Wrapper">
      <LeadingIcon3 />
      <TextContent3 />
    </div>
  );
}

function CoreInput3() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-[8px] shrink-0 w-full" data-name=".Core - Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[6px] items-center pl-[12px] pr-[6px] py-[5.5px] relative w-full">
          <ContentWrapper3 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.5)] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function BaseTextField3() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name=".Base - Text Field">
      <CoreInput3 />
    </div>
  );
}

function Input1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Input">
      <BaseTextField3 />
    </div>
  );
}

function SearchField1() {
  return (
    <div className="content-stretch flex flex-col h-full items-start relative shrink-0" data-name="Search Field">
      <Input1 />
    </div>
  );
}

function Inputs() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="Inputs">
      <div className="flex flex-row items-center self-stretch">
        <SearchField1 />
      </div>
    </div>
  );
}

function FiltersInline() {
  return (
    <div className="content-stretch flex gap-[16px] items-center relative shrink-0" data-name="Filters - Inline">
      <Inputs />
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

function ButtonIconWrapper4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <Download />
    </div>
  );
}

function BaseIconButton4() {
  return (
    <div className="bg-[rgba(255,255,255,0)] box-border content-stretch flex items-center justify-center p-[6px] relative rounded-[100px] shrink-0" data-name=".Base - Icon Button">
      <ButtonIconWrapper4 />
    </div>
  );
}

function SimpleButtonsIconButton4() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[28px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton4 />
    </div>
  );
}

function Settings() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="settings">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="settings">
          <g id="Vector">
            <path d={svgPaths.pf774e00} fill="white" fillOpacity="0.95" />
            <path d={svgPaths.p17288900} fill="white" fillOpacity="0.95" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function ButtonIconWrapper5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Button - Icon Wrapper">
      <Settings />
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
    <div className="content-stretch flex items-center justify-center relative rounded-[100px] shrink-0 size-[28px]" data-name="Simple Buttons/Icon Button">
      <BaseIconButton5 />
    </div>
  );
}

function ButtonGroup() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Button Group">
      <SimpleButtonsIconButton4 />
      <SimpleButtonsIconButton5 />
    </div>
  );
}

function Actions() {
  return (
    <div className="content-stretch flex gap-[16px] items-center justify-end relative shrink-0" data-name="Actions">
      <FiltersInline />
      <ButtonGroup />
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full" data-name="Content">
      <Text />
      <Actions />
    </div>
  );
}

function HeadersSection() {
  return (
    <div className="bg-[rgba(255,255,255,0)] relative rounded-tl-[8px] rounded-tr-[8px] shrink-0 w-full" data-name="Headers - Section">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex flex-col gap-[12px] items-start pb-[12px] pt-[16px] px-[16px] relative w-full">
          <Content />
        </div>
      </div>
    </div>
  );
}

function RowTableHeaderRowBackground() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.11)] inset-0" data-name="Row Table / Header Row Background">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.5)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableHeaderCell() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[240px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Agent name</p>
    </div>
  );
}

function RowTableHeaderCell1() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[140px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Total sessions</p>
    </div>
  );
}

function RowTableHeaderCell2() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[140px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Flagged sessions</p>
    </div>
  );
}

function RowTableHeaderCell3() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[100px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Flag rate</p>
    </div>
  );
}

function RowTableHeaderCell4() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[130px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Avg latency</p>
    </div>
  );
}

function RowTableHeaderCell5() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[120px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Tool call efficacy</p>
    </div>
  );
}

function RowTableHeaderCell6() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[120px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">{`Hallucination `}</p>
    </div>
  );
}

function RowTableHeaderCell7() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[200px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Top security issue</p>
    </div>
  );
}

function RowTableHeaderCell8() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[160px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Compliance score</p>
    </div>
  );
}

function RowTableHeaderCell9() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[140px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Agent health</p>
    </div>
  );
}

function RowTableHeaderCell10() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center pb-[15px] pt-[14px] px-[12px] relative shrink-0 w-[240px]" data-name="Row Table / Header Cell">
      <p className="font-['Inter:medium',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Details</p>
    </div>
  );
}

function RowTableHeaderRow() {
  return (
    <div className="content-stretch flex h-[36px] items-center overflow-clip relative shrink-0 w-full" data-name="Row Table / Header Row">
      <RowTableHeaderRowBackground />
      <RowTableHeaderCell />
      <RowTableHeaderCell1 />
      <RowTableHeaderCell2 />
      <RowTableHeaderCell3 />
      <RowTableHeaderCell4 />
      <RowTableHeaderCell5 />
      <RowTableHeaderCell6 />
      <RowTableHeaderCell7 />
      <RowTableHeaderCell8 />
      <RowTableHeaderCell9 />
      <RowTableHeaderCell10 />
    </div>
  );
}

function RowTableBodyRowBackgroud() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] inset-0" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Helpdesk</p>
    </div>
  );
}

function RowTableBodyCell() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase />
    </div>
  );
}

function RowTableBodyCellBase1() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">4,250</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell1() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase1 />
    </div>
  );
}

function RowTableBodyCellBase2() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">68</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell2() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase2 />
    </div>
  );
}

function RowTableBodyCellBase3() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.5%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell3() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase3 />
    </div>
  );
}

function RowTableBodyCellBase4() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">900ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell4() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase4 />
    </div>
  );
}

function RowTableBodyCellBase5() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">92.5%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell5() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase5 />
    </div>
  );
}

function RowTableBodyCellBase6() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">No</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell6() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase6 />
    </div>
  );
}

function RowTableBodyCellBase7() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Prompt injection</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell7() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase7 />
    </div>
  );
}

function RowTableBodyCellBase8() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">94%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell8() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase8 />
    </div>
  );
}

function CheckCircleBadge() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="check-circle-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="check-circle-badge">
          <path d={svgPaths.p2430f40} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <CheckCircleBadge />
    </div>
  );
}

function BaseChip() {
  return (
    <div className="bg-[#0e2b20] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#3cc29a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Secure</p>
      </div>
    </div>
  );
}

function AlertChip() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip />
    </div>
  );
}

function RowTableBodyCellBase9() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell9() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase9 />
    </div>
  );
}

function StandaloneLink() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase10() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink />
    </div>
  );
}

function RowTableBodyCell10() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase10 />
    </div>
  );
}

function RowTableBodyRow() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell1 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell2 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell3 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell4 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell5 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell6 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell7 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell8 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell9 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell10 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud1() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] inset-0" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase11() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Support</p>
    </div>
  );
}

function RowTableBodyCell11() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase11 />
    </div>
  );
}

function RowTableBodyCellBase12() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">3,800</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell12() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase12 />
    </div>
  );
}

function RowTableBodyCellBase13() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">70</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell13() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase13 />
    </div>
  );
}

function RowTableBodyCellBase14() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.2%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell14() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase14 />
    </div>
  );
}

function RowTableBodyCellBase15() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">850ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell15() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase15 />
    </div>
  );
}

function RowTableBodyCellBase16() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">89.0%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell16() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase16 />
    </div>
  );
}

function RowTableBodyCellBase17() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Yes</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell17() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase17 />
    </div>
  );
}

function RowTableBodyCellBase18() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">PII leakage</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell18() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase18 />
    </div>
  );
}

function RowTableBodyCellBase19() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">90%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell19() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase19 />
    </div>
  );
}

function ErrorLegacyBadge() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="error-legacy-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="error-legacy-badge">
          <path d={svgPaths.p390ac400} fill="var(--fill-0, #FC8B98)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement1() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <ErrorLegacyBadge />
    </div>
  );
}

function BaseChip1() {
  return (
    <div className="bg-[#4f0e10] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#fc8b98] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement1 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">At risk</p>
      </div>
    </div>
  );
}

function AlertChip1() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip1 />
    </div>
  );
}

function RowTableBodyCellBase20() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip1 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell20() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase20 />
    </div>
  );
}

function StandaloneLink1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase21() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink1 />
    </div>
  );
}

function RowTableBodyCell21() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase21 />
    </div>
  );
}

function RowTableBodyRow1() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud1 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell11 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell12 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell13 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell14 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell15 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell16 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell17 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell18 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell19 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell20 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell21 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud2() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[48px] left-0 top-0 w-[1584px]" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase22() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Chatbot</p>
    </div>
  );
}

function RowTableBodyCell22() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase22 />
    </div>
  );
}

function RowTableBodyCellBase23() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">5,100</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell23() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase23 />
    </div>
  );
}

function RowTableBodyCellBase24() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">65</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell24() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase24 />
    </div>
  );
}

function RowTableBodyCellBase25() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.8%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell25() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase25 />
    </div>
  );
}

function RowTableBodyCellBase26() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1,000ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell26() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase26 />
    </div>
  );
}

function RowTableBodyCellBase27() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">95.0%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell27() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase27 />
    </div>
  );
}

function RowTableBodyCellBase28() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Yes</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell28() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase28 />
    </div>
  );
}

function RowTableBodyCellBase29() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Context deviation</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell29() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase29 />
    </div>
  );
}

function RowTableBodyCellBase30() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">92%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell30() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase30 />
    </div>
  );
}

function WarningBadge() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="warning-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="warning-badge">
          <path d={svgPaths.p2ad17300} fill="var(--fill-0, #F2990A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <WarningBadge />
    </div>
  );
}

function BaseChip2() {
  return (
    <div className="bg-[#36220c] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#f2990a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement2 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Review</p>
      </div>
    </div>
  );
}

function AlertChip2() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip2 />
    </div>
  );
}

function RowTableBodyCellBase31() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip2 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell31() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase31 />
    </div>
  );
}

function StandaloneLink2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase32() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink2 />
    </div>
  );
}

function RowTableBodyCell32() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase32 />
    </div>
  );
}

function RowTableBodyRow2() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud2 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell22 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell23 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell24 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell25 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell26 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell27 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell28 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell29 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell30 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell31 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell32 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud3() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] inset-0" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase33() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Technical</p>
    </div>
  );
}

function RowTableBodyCell33() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase33 />
    </div>
  );
}

function RowTableBodyCellBase34() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">4,750</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell34() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase34 />
    </div>
  );
}

function RowTableBodyCellBase35() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">75</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell35() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase35 />
    </div>
  );
}

function RowTableBodyCellBase36() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.0%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell36() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase36 />
    </div>
  );
}

function RowTableBodyCellBase37() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">700ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell37() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase37 />
    </div>
  );
}

function RowTableBodyCellBase38() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">93.5%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell38() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase38 />
    </div>
  );
}

function RowTableBodyCellBase39() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">No</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell39() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase39 />
    </div>
  );
}

function RowTableBodyCellBase40() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Instruction deviation</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell40() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase40 />
    </div>
  );
}

function RowTableBodyCellBase41() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">93%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell41() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase41 />
    </div>
  );
}

function CheckCircleBadge1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="check-circle-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="check-circle-badge">
          <path d={svgPaths.p2430f40} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <CheckCircleBadge1 />
    </div>
  );
}

function BaseChip3() {
  return (
    <div className="bg-[#0e2b20] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#3cc29a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement3 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Secure</p>
      </div>
    </div>
  );
}

function AlertChip3() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip3 />
    </div>
  );
}

function RowTableBodyCellBase42() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip3 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell42() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase42 />
    </div>
  );
}

function StandaloneLink3() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase43() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink3 />
    </div>
  );
}

function RowTableBodyCell43() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase43 />
    </div>
  );
}

function RowTableBodyRow3() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud3 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell33 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell34 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell35 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell36 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell37 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell38 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell39 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell40 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell41 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell42 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell43 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud4() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] inset-0" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase44() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Billing</p>
    </div>
  );
}

function RowTableBodyCell44() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase44 />
    </div>
  );
}

function RowTableBodyCellBase45() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">2,900</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell45() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase45 />
    </div>
  );
}

function RowTableBodyCellBase46() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">80</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell46() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase46 />
    </div>
  );
}

function RowTableBodyCellBase47() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">2.0%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell47() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase47 />
    </div>
  );
}

function RowTableBodyCellBase48() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1,200ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell48() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase48 />
    </div>
  );
}

function RowTableBodyCellBase49() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">88.5%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell49() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase49 />
    </div>
  );
}

function RowTableBodyCellBase50() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">No</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell50() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase50 />
    </div>
  );
}

function RowTableBodyCellBase51() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Tool misuse</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell51() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase51 />
    </div>
  );
}

function RowTableBodyCellBase52() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">91%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell52() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase52 />
    </div>
  );
}

function CheckCircleBadge2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="check-circle-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="check-circle-badge">
          <path d={svgPaths.p2430f40} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <CheckCircleBadge2 />
    </div>
  );
}

function BaseChip4() {
  return (
    <div className="bg-[#0e2b20] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#3cc29a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement4 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Secure</p>
      </div>
    </div>
  );
}

function AlertChip4() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip4 />
    </div>
  );
}

function RowTableBodyCellBase53() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip4 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell53() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase53 />
    </div>
  );
}

function StandaloneLink4() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase54() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink4 />
    </div>
  );
}

function RowTableBodyCell54() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase54 />
    </div>
  );
}

function RowTableBodyRow4() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud4 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell44 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell45 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell46 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell47 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell48 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell49 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell50 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell51 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell52 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell53 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell54 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud5() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] inset-0" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase55() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Symptoms</p>
    </div>
  );
}

function RowTableBodyCell55() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase55 />
    </div>
  );
}

function RowTableBodyCellBase56() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">6,000</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell56() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase56 />
    </div>
  );
}

function RowTableBodyCellBase57() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">60</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell57() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase57 />
    </div>
  );
}

function RowTableBodyCellBase58() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.3%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell58() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase58 />
    </div>
  );
}

function RowTableBodyCellBase59() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">950ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell59() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase59 />
    </div>
  );
}

function RowTableBodyCellBase60() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">90.2%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell60() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase60 />
    </div>
  );
}

function RowTableBodyCellBase61() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">No</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell61() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase61 />
    </div>
  );
}

function RowTableBodyCellBase62() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Harmful medical advice</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell62() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase62 />
    </div>
  );
}

function RowTableBodyCellBase63() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">95%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell63() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase63 />
    </div>
  );
}

function CheckCircleBadge3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="check-circle-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="check-circle-badge">
          <path d={svgPaths.p2430f40} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <CheckCircleBadge3 />
    </div>
  );
}

function BaseChip5() {
  return (
    <div className="bg-[#0e2b20] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#3cc29a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement5 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Secure</p>
      </div>
    </div>
  );
}

function AlertChip5() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip5 />
    </div>
  );
}

function RowTableBodyCellBase64() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip5 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell64() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase64 />
    </div>
  );
}

function StandaloneLink5() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase65() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink5 />
    </div>
  );
}

function RowTableBodyCell65() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase65 />
    </div>
  );
}

function RowTableBodyRow5() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud5 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell55 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell56 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell57 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell58 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell59 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell60 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell61 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell62 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell63 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell64 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell65 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud6() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] inset-0" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase66() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Compliance</p>
    </div>
  );
}

function RowTableBodyCell66() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase66 />
    </div>
  );
}

function RowTableBodyCellBase67() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">3,600</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell67() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase67 />
    </div>
  );
}

function RowTableBodyCellBase68() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">72</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell68() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase68 />
    </div>
  );
}

function RowTableBodyCellBase69() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.4%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell69() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase69 />
    </div>
  );
}

function RowTableBodyCellBase70() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">800ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell70() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase70 />
    </div>
  );
}

function RowTableBodyCellBase71() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">91.0%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell71() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase71 />
    </div>
  );
}

function RowTableBodyCellBase72() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Yes</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell72() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase72 />
    </div>
  );
}

function RowTableBodyCellBase73() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">RAG inaccuracies</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell73() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase73 />
    </div>
  );
}

function RowTableBodyCellBase74() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">89%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell74() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase74 />
    </div>
  );
}

function WarningBadge1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="warning-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="warning-badge">
          <path d={svgPaths.p2ad17300} fill="var(--fill-0, #F2990A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function AlertChip6() {
  return (
    <div className="bg-[#36220c] box-border content-stretch flex gap-[4px] items-center px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Alert Chip">
      <div aria-hidden="true" className="absolute border border-[#f2990a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <WarningBadge1 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Review</p>
      </div>
    </div>
  );
}

function RowTableBodyCellBase75() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip6 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell75() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase75 />
    </div>
  );
}

function StandaloneLink6() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase76() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink6 />
    </div>
  );
}

function RowTableBodyCell76() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase76 />
    </div>
  );
}

function RowTableBodyRow6() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud6 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell66 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell67 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell68 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell69 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell70 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell71 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell72 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell73 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell74 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell75 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell76 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud7() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] inset-0" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase77() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Feedback</p>
    </div>
  );
}

function RowTableBodyCell77() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase77 />
    </div>
  );
}

function RowTableBodyCellBase78() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">4,200</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell78() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase78 />
    </div>
  );
}

function RowTableBodyCellBase79() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">74</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell79() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase79 />
    </div>
  );
}

function RowTableBodyCellBase80() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.6%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell80() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase80 />
    </div>
  );
}

function RowTableBodyCellBase81() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">600ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell81() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase81 />
    </div>
  );
}

function RowTableBodyCellBase82() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">94.7%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell82() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase82 />
    </div>
  );
}

function RowTableBodyCellBase83() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">No</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell83() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase83 />
    </div>
  );
}

function RowTableBodyCellBase84() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Context deviation</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell84() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase84 />
    </div>
  );
}

function RowTableBodyCellBase85() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">88%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell85() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase85 />
    </div>
  );
}

function CheckCircleBadge4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="check-circle-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="check-circle-badge">
          <path d={svgPaths.p2430f40} fill="var(--fill-0, #3CC29A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement6() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <CheckCircleBadge4 />
    </div>
  );
}

function BaseChip6() {
  return (
    <div className="bg-[#0e2b20] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#3cc29a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement6 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Secure</p>
      </div>
    </div>
  );
}

function AlertChip7() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip6 />
    </div>
  );
}

function RowTableBodyCellBase86() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip7 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell86() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase86 />
    </div>
  );
}

function StandaloneLink7() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase87() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink7 />
    </div>
  );
}

function RowTableBodyCell87() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase87 />
    </div>
  );
}

function RowTableBodyRow7() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud7 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell77 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell78 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell79 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell80 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell81 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell82 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell83 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell84 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell85 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell86 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell87 />
      </div>
    </div>
  );
}

function RowTableBodyRowBackgroud8() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0)] h-[48px] left-0 top-0 w-[1584px]" data-name="Row Table / Body Row Backgroud">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[rgba(255,255,255,0.2)] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
    </div>
  );
}

function RowTableBodyCellBase88() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Agent_Quality</p>
    </div>
  );
}

function RowTableBodyCell88() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase88 />
    </div>
  );
}

function RowTableBodyCellBase89() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">3,300</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell89() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase89 />
    </div>
  );
}

function RowTableBodyCellBase90() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">69</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell90() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase90 />
    </div>
  );
}

function RowTableBodyCellBase91() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">1.1%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell91() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[100px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase91 />
    </div>
  );
}

function RowTableBodyCellBase92() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">750ms</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell92() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[130px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase92 />
    </div>
  );
}

function RowTableBodyCellBase93() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">92.3%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell93() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase93 />
    </div>
  );
}

function RowTableBodyCellBase94() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Yes</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell94() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[120px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase94 />
    </div>
  );
}

function RowTableBodyCellBase95() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">Prompt injection</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell95() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[200px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase95 />
    </div>
  );
}

function RowTableBodyCellBase96() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-nowrap whitespace-pre">90%</p>
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell96() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[160px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase96 />
    </div>
  );
}

function WarningBadge2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="warning-badge">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="warning-badge">
          <path d={svgPaths.p2ad17300} fill="var(--fill-0, #F2990A)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function LeadingElement7() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name=".Leading Element">
      <WarningBadge2 />
    </div>
  );
}

function BaseChip7() {
  return (
    <div className="bg-[#36220c] box-border content-stretch flex gap-[4px] h-[24px] items-center px-[8px] py-0 relative rounded-[4px] shrink-0" data-name=".Base - Chip">
      <div aria-hidden="true" className="absolute border border-[#f2990a] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <LeadingElement7 />
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.95)] text-center text-nowrap">
        <p className="leading-[20px] whitespace-pre">Review</p>
      </div>
    </div>
  );
}

function AlertChip8() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Alert Chip">
      <BaseChip7 />
    </div>
  );
}

function RowTableBodyCellBase97() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0" data-name="Row Table / .Body Cell Base">
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative w-full">
          <AlertChip8 />
        </div>
      </div>
    </div>
  );
}

function RowTableBodyCell97() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[140px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase97 />
    </div>
  );
}

function StandaloneLink8() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0" data-name="Standalone Link">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#64b4fa] text-[14px] text-nowrap whitespace-pre">View</p>
    </div>
  );
}

function RowTableBodyCellBase98() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center px-[12px] py-0 relative shrink-0" data-name="Row Table / .Body Cell Base">
      <StandaloneLink8 />
    </div>
  );
}

function RowTableBodyCell98() {
  return (
    <div className="content-stretch flex h-full items-center relative shrink-0 w-[240px]" data-name="Row Table / Body Cell">
      <RowTableBodyCellBase98 />
    </div>
  );
}

function RowTableBodyRow8() {
  return (
    <div className="box-border content-stretch flex items-center min-h-[48px] px-0 py-[4px] relative shrink-0 w-full" data-name="Row Table / Body Row">
      <RowTableBodyRowBackgroud8 />
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell88 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell89 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell90 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell91 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell92 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell93 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell94 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell95 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell96 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell97 />
      </div>
      <div className="flex flex-row items-center self-stretch">
        <RowTableBodyCell98 />
      </div>
    </div>
  );
}

function TableSession() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[4px] shrink-0 w-full" data-name="Table - Session">
      <RowTableHeaderRow />
      <RowTableBodyRow />
      <RowTableBodyRow1 />
      <RowTableBodyRow2 />
      <RowTableBodyRow3 />
      <RowTableBodyRow4 />
      <RowTableBodyRow5 />
      <RowTableBodyRow6 />
      <RowTableBodyRow7 />
      <RowTableBodyRow8 />
    </div>
  );
}

function SessionsTable() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Sessions table">
      <HeadersSection />
      <TableSession />
    </div>
  );
}

function ObservabilityView() {
  return (
    <div className="basis-0 content-stretch flex flex-col gap-[12px] grow h-full items-start min-h-px min-w-px relative shrink-0" data-name="OBSERVABILITY VIEW">
      <CardsOnly />
      <SessionsTable />
    </div>
  );
}

function Scrollbar() {
  return (
    <div className="bg-[rgba(255,255,255,0.11)] box-border content-stretch flex gap-[10px] h-full items-start p-[2px] relative rounded-[8px] shrink-0" data-name="Scrollbar">
      <div className="h-[50px] relative shrink-0 w-[12px]" data-name="Indicator">
        <div className="absolute inset-0" style={{ "--fill-0": "rgba(255, 255, 255, 1)" } as React.CSSProperties}>
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 50">
            <path clipRule="evenodd" d={svgPaths.p26f45080} fill="var(--fill-0, white)" fillOpacity="0.4" fillRule="evenodd" id="Indicator" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Layout() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px overflow-clip relative shrink-0 w-full" data-name="Layout">
      <ObservabilityView />
      <Scrollbar />
    </div>
  );
}

function PrimaryContentArea() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px overflow-clip relative shrink-0 w-full" data-name="Primary Content Area">
      <Layout />
    </div>
  );
}

function PageContent() {
  return (
    <div className="absolute backdrop-blur-[400px] backdrop-filter bg-[rgba(0,0,0,0.4)] box-border content-stretch flex flex-col gap-[24px] h-[1016px] items-start left-0 p-[24px] rounded-tl-[16px] top-0 w-[1656px]" data-name=".Page Content">
      <Header />
      <PrimaryContentArea />
    </div>
  );
}

export default function MainContentArea() {
  return (
    <div className="relative size-full" data-name=".Main Content Area">
      <PageContent />
    </div>
  );
}