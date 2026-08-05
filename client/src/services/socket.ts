import { io, type Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { useLiveStore } from '../store/live.store';
import { ROUTES } from '../constants/routes';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

let socket: Socket | null = null;
let clearing = false;

async function tryRefreshToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      '/api/auth/refresh',
      {},
      { baseURL: BASE_URL, withCredentials: true },
    );
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

function forceLogout() {
  if (clearing) return;
  clearing = true;
  useAuthStore.getState().clearAuth();
  disconnectSocket();
  window.location.href = ROUTES.LOGIN;
}

/**
 * Create (or return the existing) socket.io connection.
 * The `auth` callback runs on EVERY connect attempt, so a fresh access
 * token is always presented; on `auth_required` the token is refreshed
 * and socket.io reconnects automatically.
 */
export function connectSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  if (socket) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  clearing = false;
  socket = io(BASE_URL, {
    path: '/ws',
    transports: ['websocket'],
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    useLiveStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    useLiveStore.getState().setConnected(false);
  });

  socket.on('connect_error', async () => {
    const current = useAuthStore.getState();
    if (!current.accessToken) {
      disconnectSocket();
      return;
    }
    // Token may be expired — try refreshing; socket.io retries with the new
    // token via the auth callback. Do NOT force logout on network failures.
    await tryRefreshToken();
  });

  socket.on('auth_required', async () => {
    const fresh = await tryRefreshToken();
    if (!fresh) {
      forceLogout();
      return;
    }
    socket?.connect();
  });

  socket.on('force_logout', () => forceLogout());

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  useLiveStore.getState().setConnected(false);
}

export function getSocket(): Socket | null {
  return socket;
}

/** Join a page-scoped WS room so the server can push page alerts (e.g. list refresh pushes). */
export function joinPage(page: string) {
  socket?.emit('join_page', page);
}

export function leavePage(page: string) {
  socket?.emit('leave_page', page);
}
