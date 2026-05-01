import { useNavigate } from 'react-router-dom';
import EvaCanvasSurface from './canvas/EvaCanvasSurface';

export default function EvaCanvas() {
  const navigate = useNavigate();

  return (
    <div className="primary-content eva-canvas-page">
      <EvaCanvasSurface onBack={() => navigate('/agents')} />
    </div>
  );
}
