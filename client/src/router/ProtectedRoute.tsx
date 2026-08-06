import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import { ROUTES } from '../constants/routes';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

/** Best-effort JWT expiry check (payload.exp is in seconds). Malformed → expired. */
const isTokenExpired = (token: string): boolean => {
  try {
    // JWT payloads use base64url — normalize to standard base64 before decoding.
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

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
    if (!accessToken) return; // no token → the render path redirects immediately

    let cancelled = false;

    const verify = async () => {
      // If the stored access token is already expired, refresh it FIRST so we
      // never fire a doomed /me request — that would log a 401 in the console
      // that the response interceptor would only recover from afterwards.
      // Refreshing updates the store token, which re-runs this effect with a
      // fresh token that validates cleanly.
      if (isTokenExpired(accessToken)) {
        try {
          const { data } = await authApi.refreshToken();
          if (cancelled) return;
          useAuthStore.getState().setAccessToken(data.accessToken);
          if (data.accessToken === accessToken) {
            // Token didn't actually change — don't rely on the effect
            // re-running; validate /me directly below instead.
          } else {
            return; // effect re-runs with the fresh token and validates below
          }
        } catch {
          if (cancelled) return;
          clearAuth();
          setIsValid(false);
          setIsVerifying(false);
          return;
        }
      }

      try {
        const res = await authApi.getCurrentUser();
        if (cancelled) return;
        const currentToken = useAuthStore.getState().accessToken || accessToken;
        setAuth(res.data, currentToken);
        setIsValid(true);
      } catch {
        if (cancelled) return;
        clearAuth();
        setIsValid(false);
      } finally {
        if (!cancelled) setIsVerifying(false);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [accessToken, setAuth, clearAuth]);

  // No token at all — redirect immediately (no spinner, no wasted request)
  if (!accessToken) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

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

  // Validation failed — redirect to login
  if (!isValid) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Authenticated but wrong role — redirect to dashboard
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // All good — render children
  return <>{children}</>;
};
