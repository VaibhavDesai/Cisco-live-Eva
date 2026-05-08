import svgPaths from "./svg-gqj7elh1jk";

function Speaker() {
  return (
    <div className="absolute left-[407px] size-[16px] top-[8px]" data-name="speaker">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="speaker">
          <g id="Vector">
            <path d={svgPaths.p2fccef80} fill="#0F0F0F" />
            <path d={svgPaths.p3752b900} fill="#0F0F0F" />
            <path d={svgPaths.p2c8d9c70} fill="#0F0F0F" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function TooFast() {
  return (
    <div className="absolute left-[435px] size-[16px] top-[8px]" data-name="too-fast">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="too-fast">
          <g id="Vector">
            <path d={svgPaths.p242eb980} fill="#0F0F0F" />
            <path d={svgPaths.p3ad42080} fill="#0F0F0F" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Pause() {
  return (
    <div className="absolute left-[16px] size-[16px] top-[8px]" data-name="pause">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="pause">
          <g id="Vector">
            <path d={svgPaths.pacc8ac0} fill="#0F0F0F" />
            <path d={svgPaths.p98f6a00} fill="#0F0F0F" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default function Frame() {
  return (
    <div className="bg-[#ededed] relative rounded-[8px] size-full">
      <p className="absolute font-['CiscoSans:Regular',sans-serif] leading-[2] left-[39.75px] not-italic right-[0.25px] text-[#121212] text-[14px] top-[2px]">0:00 / 4:00</p>
      <Speaker />
      <TooFast />
      <div className="absolute bg-[#d9d9d9] h-[4px] left-[121.97px] rounded-[2.132px] top-[14.13px] w-[277px]" />
      <div className="absolute bg-[#bababa] h-[4px] left-[122px] rounded-[2.132px] top-[14px] w-[277px]" />
      <div className="absolute bg-[#353535] h-[4px] left-[121.97px] rounded-[2.132px] top-[14.13px] w-[26px]" />
      <Pause />
    </div>
  );
}