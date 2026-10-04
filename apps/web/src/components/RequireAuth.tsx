import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../features/auth/AuthContext';
import { safeRedirectPath } from '../features/auth/redirect';

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Login and register pages: once logged in, go to the page that was requested before. */
export function RedirectIfAuthenticated() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    const from = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={safeRedirectPath(from)} replace />;
  }
  return <Outlet />;
}
