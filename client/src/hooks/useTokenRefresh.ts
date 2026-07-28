import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (before the 15min access token expiry)

/**
 * Silently refreshes the access token before it expires.
 *
 * - Runs a 10-minute interval while the user is authenticated.
 * - Also refreshes when the user returns to the tab (visibilitychange).
 * - If the refresh fails, auth is cleared — no toast, clean redirect.
 */
export function useTokenRefresh() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shared refresh handler
  const doRefresh = async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) return; // already logged out

    try {
      const { data } = await authApi.refreshToken();
      useAuthStore.getState().setAccessToken(data.accessToken);
    } catch {
      // Refresh failed — silently clear auth and let ProtectedRoute redirect
      useAuthStore.getState().clearAuth();
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up interval when logged out
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // ── Periodic refresh every 10 minutes ──
    intervalRef.current = setInterval(doRefresh, REFRESH_INTERVAL_MS);

    // ── Refresh when user returns to the tab ──
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // NOTE: intentionally run this effect only on mount/unmount of the auth state,
    // not on every render. The `doRefresh` function reads fresh state from the store.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}
