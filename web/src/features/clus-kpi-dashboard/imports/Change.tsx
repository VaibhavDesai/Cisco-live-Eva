import svgPaths from "./svg-jfhb59xspc";

function Step() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="step">
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(255,255,255,0.95)] whitespace-nowrap" style={{ fontFeatureSettings: "'ss02'" }}>
        <ol start="1">
          <li className="ms-[24px]">
            <span className="leading-[24px]">Technical Support Agent</span>
          </li>
        </ol>
      </div>
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="next">
        <div className="absolute inset-[15.66%_6.25%_15.59%_6.25%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.9999 11.0002">
            <path d={svgPaths.p76fb300} fill="var(--fill-0, white)" fillOpacity="0.95" id="Vector" />
          </svg>
        </div>
      </div>
      <div className="flex flex-col font-['Inter:regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-[rgba(255,255,255,0.95)] whitespace-nowrap" style={{ fontFeatureSettings: "'ss02'" }}>
        <ol start="2">
          <li className="ms-[24px]">
            <span className="leading-[24px]">Billing Specialist</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default function Change() {
  return (
    <div className="bg-[rgba(255,255,255,0.11)] content-stretch flex items-center justify-between px-[16px] py-[12px] relative rounded-[8px] size-full" data-name="change">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <Step />
    </div>
  );
}