import { useDesignVariation } from '../contexts/DesignVariationContext';
import EvaChatExperience from '../features/eva/EvaChatExperience';
import EvaAgentsTable from '../features/eva/EvaAgentsTable';
import EvaCanvasOverlay from '../features/eva/EvaCanvasOverlay';
import EvaFormBuilder from '../features/eva/EvaFormBuilder';

export default function Agents() {
  const { variation } = useDesignVariation();

  /* Preserve the established variation surfaces. The three-family
     creation model is introduced inside the canonical dashboard chat,
     rather than replacing this page with another shell. */
  let variationView;
  if (variation === 'dashboard') {
    variationView = <EvaAgentsTable />;
  } else if (variation === 'form-bases') {
    variationView = <EvaFormBuilder />;
  } else {
    variationView = <EvaChatExperience voiceTranscribePath="/elevenlabs/transcribe" />;
  }

  return (
    <>
      {variationView}
      {(variation === 'dashboard' || variation === 'form-bases') && <EvaCanvasOverlay />}
    </>
  );
}
