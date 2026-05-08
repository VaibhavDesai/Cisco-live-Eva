import svgPaths from "./svg-pu3pg0146l";

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
    <div className="absolute content-stretch flex flex-col items-start left-0 top-0 w-[400px]" data-name="Search Field">
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
    <div className="absolute content-stretch flex flex-col items-start left-[408px] top-0 w-[180px]" data-name="Filter">
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
      <p className="font-['Inter:regular',sans-serif] leading-[20px] mr-[-2px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Agent channel</p>
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
    <div className="absolute content-stretch flex flex-col items-start left-[596px] top-0 w-[180px]" data-name="Select">
      <BaseSelect1 />
    </div>
  );
}

function Filter3() {
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

function LeadingIcon3() {
  return (
    <div className="content-stretch flex items-center justify-center relative rounded-[24px] shrink-0" data-name="Leading Icon">
      <Filter3 />
    </div>
  );
}

function CoreInputContent3() {
  return (
    <div className="box-border content-stretch flex h-[21px] items-center pl-0 pr-[2px] py-0 relative shrink-0" data-name=".Core - Input Content">
      <p className="font-['Inter:regular',sans-serif] leading-[20px] mr-[-2px] not-italic relative shrink-0 text-[14px] text-[rgba(255,255,255,0.7)] text-nowrap whitespace-pre">Last 24 hours</p>
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

function TrailingIcon2() {
  return (
    <div className="box-border content-stretch flex items-center justify-center p-[2px] relative shrink-0" data-name="Trailing Icon">
      <ArrowDown2 />
    </div>
  );
}

function ContentWrapper3() {
  return (
    <div className="basis-0 content-stretch flex gap-[6px] grow h-[21px] items-center min-h-px min-w-px relative shrink-0" data-name="Content Wrapper">
      <LeadingIcon3 />
      <TextContent3 />
      <TrailingIcon2 />
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

function BaseSelect2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name=".Base - Select">
      <BaseTextField3 />
    </div>
  );
}

function Select2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Select">
      <BaseSelect2 />
    </div>
  );
}

function Filter4() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[784px] top-0 w-[180px]" data-name="Filter">
      <Select2 />
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
    <div className="absolute content-stretch flex items-start left-[972px] top-0" data-name="Split Icon Button/Unmute">
      <ButtonGroupIconGroup />
    </div>
  );
}

export default function Filters() {
  return (
    <div className="relative size-full" data-name="Filters">
      <SearchField />
      <Filter1 />
      <Select1 />
      <Filter4 />
      <SplitIconButtonUnmute />
    </div>
  );
}