import { Navigate } from 'react-router-dom';

/* Kept as a compatibility export for older imports. The Uplift shell no
   longer has a separate dashboard/New Agent destination. */
export default function Dashboard() {
  return <Navigate to="/agents" replace />;
}
