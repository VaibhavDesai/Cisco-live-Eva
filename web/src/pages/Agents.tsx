import { useDesignVariation } from '../contexts/DesignVariationContext';
import EvaChatExperience from '../features/eva/EvaChatExperience';
import EvaAgentsTable from '../features/eva/EvaAgentsTable';
import EvaCanvasOverlay from '../features/eva/EvaCanvasOverlay';
import EvaFormBuilder from '../features/eva/EvaFormBuilder';

export default function Agents() {
  const { variation } = useDesignVariation();

  /* The chat-based experience owns its orchestration canvas so switching
     routes replaces only the working zone and keeps the conversation rail
     mounted. Legacy table/form variations still use the standalone overlay. */
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
