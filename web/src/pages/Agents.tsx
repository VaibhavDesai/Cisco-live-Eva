import { useDesignVariation } from '../contexts/DesignVariationContext';
import EvaChatExperience from '../features/eva/EvaChatExperience';
import EvaAgentsTable from '../features/eva/EvaAgentsTable';
import EvaCanvasOverlay from '../features/eva/EvaCanvasOverlay';
import EvaFormBuilder from '../features/eva/EvaFormBuilder';

export default function Agents() {
  const { variation } = useDesignVariation();

  /* Pick the underlying view by variation, then layer the canvas overlay on
     top of it. The overlay is route-driven (`/agents/eva-canvas` opens,
     `/agents` closes) and slides in from the right, so the variation view
     stays mounted underneath and the slide animation has a stable
     background to reveal/cover. */
  let variationView;
  if (variation === 'dashboard') {
    variationView = <EvaAgentsTable />;
  } else if (variation === 'form-bases') {
    variationView = <EvaFormBuilder />;
  } else {
    variationView = <EvaChatExperience />;
  }

  return (
    <>
      {variationView}
      <EvaCanvasOverlay />
    </>
  );
}
