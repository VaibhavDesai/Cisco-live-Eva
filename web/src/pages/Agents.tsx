import { useDesignVariation } from '../contexts/DesignVariationContext';
import EvaAgentsTable from '../features/eva/EvaAgentsTable';
import EvaFormBuilder from '../features/eva/EvaFormBuilder';

export default function Agents() {
  const { variation } = useDesignVariation();

  /* The AI Assistant now lives once at shell level. This route owns only
     the product surface, so route changes never remount the conversation. */
  return variation === 'form-bases' ? <EvaFormBuilder /> : <EvaAgentsTable />;
}
