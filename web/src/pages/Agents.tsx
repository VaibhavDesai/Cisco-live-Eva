import { useDesignVariation } from '../contexts/DesignVariationContext';
import { useApp } from '../contexts/AppContext';
import EvaChatExperience from '../features/eva/EvaChatExperience';
import EvaAgentsTable from '../features/eva/EvaAgentsTable';
import EvaCanvasOverlay from '../features/eva/EvaCanvasOverlay';
import EvaFormBuilder from '../features/eva/EvaFormBuilder';

export default function Agents() {
  const { variation } = useDesignVariation();
  const { agents, agentDrafts } = useApp();
  const hasFamilyAgents = Object.keys(agentDrafts).length > 0
    || Object.values(agents).some(agent => Boolean(agent.family));

  /* Preserve the established variation surfaces. The three-family
     creation model is introduced inside the canonical dashboard chat,
     rather than replacing this page with another shell. */
  let variationView;
  if (variation === 'dashboard') {
    variationView = hasFamilyAgents
      ? <EvaAgentsTable />
      : <EvaChatExperience voiceTranscribePath="/elevenlabs/transcribe" />;
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
