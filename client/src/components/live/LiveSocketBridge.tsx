import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { useAuthStore } from '../../store/auth.store';
import { useLiveStore } from '../../store/live.store';

interface ShipmentUpdatedPayload {
  shipment_id: string;
  new_status?: string;
  status?: string;
  occurred_at?: string;
}

interface AlertNewPayload {
  alertId?: string;
  alertTitle?: string;
  alertSeverity?: string;
  shipmentRef?: string | null;
}

/**
 * Mounted once inside the QueryClientProvider. Owns the socket lifecycle:
 * connects when authenticated, listens for live events, invalidates React
 * Query keys so shown data refreshes instantly (no polling), and disconnects
 * on logout.
 */
export function LiveSocketBridge() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      useLiveStore.getState().reset();
      return;
    }

    const socket = connectSocket();
    if (!socket) return;

    const handleShipmentUpdated = (payload: ShipmentUpdatedPayload) => {
      useLiveStore.getState().pushEvent({
        id: `shipment:updated:${payload.shipment_id}:${Date.now()}`,
        shipmentId: payload.shipment_id,
        newStatus: payload.new_status ?? payload.status ?? null,
        occurredAt: payload.occurred_at ?? null,
        receivedAt: Date.now(),
      });
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-detail'] });
    };

    const handleConnect = () => {
      // Refetch lists on (re)connect so anything missed while offline appears.
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };

    const handleAlertNew = (_payload: AlertNewPayload) => {
      // Live push replaces the 15s poll as the primary notification path;
      // the poll stays as a reconnect fallback.
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    };

    socket.on('shipment:updated', handleShipmentUpdated);
    socket.on('alert:new', handleAlertNew);
    socket.on('connect', handleConnect);

    return () => {
      socket.off('shipment:updated', handleShipmentUpdated);
      socket.off('alert:new', handleAlertNew);
      socket.off('connect', handleConnect);
    };
  }, [isAuthenticated, accessToken, queryClient]);

  return null;
}