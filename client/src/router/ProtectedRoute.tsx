import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import { ROUTES } from '../constants/routes';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: Array<
    'super_admin' | 'admin' | 'shipper' | 'carrier' | 'regulator'
  >;
  /** Where to redirect if not authenticated. Defaults to /login */
  redirectTo?: string;
}

/**
 * Wraps a route that requires authentication.
 *
 * 1. **No local token** → redirect immediately (no wasted API call).
 * 2. **Has local token** → calls `GET /api/auth/me` to validate server-side.
 *    - If the token is expired or the user is inactive, auth is cleared and
 *      the user is redirected to login.
 *    - On success, the store is refreshed with the latest user data from the
 *      server.
 * 3. **Role check** — if `requiredRoles` is provided, also checks that the
 *    authenticated user's role matches. On mismatch, redirects to /dashboard.
 *
 * The attempted URL is preserved via `location.state.from` so the login page
 * can redirect back after a successful login.
 */
export const ProtectedRoute = ({
  children,
  requiredRoles,
  redirectTo = ROUTES.LOGIN,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!accessToken) {
      setIsVerifying(false);
      setIsValid(false);
      return;
    }

    authApi
      .getCurrentUser()
      .then((res) => {
        if (cancelled) return;
        setAuth(res.data, accessToken);
        setIsValid(true);
        setIsVerifying(false);
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        setIsValid(false);
        setIsVerifying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, setAuth, clearAuth]);

  // Still checking with the server — show spinner
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-[#94A3B8]">Verifying your session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!isValid || !accessToken) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Authenticated but wrong role — redirect to dashboard
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // All good — render children
  return <>{children}</>;
};
