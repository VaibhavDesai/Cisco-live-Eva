import landingSparkleIcon from './landing-sparkle.svg';

export default function DialogProvenanceLabel() {
  return (
    <span className="dialog-provenance-label">
      <img
        className="dialog-provenance-label__icon"
        src={landingSparkleIcon}
        alt=""
        aria-hidden="true"
      />
      <span>Powered by Dialog</span>
    </span>
  );
}
