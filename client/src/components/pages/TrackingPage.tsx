import { useEffect } from 'react';
import { LiveMap } from '../map/LiveMap';
import { Card } from '../ui/Card';
import { joinPage, leavePage } from '../../services/socket';

export const TrackingPage = () => {
  useEffect(() => {
    joinPage('tracking');
    return () => leavePage('tracking');
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Live Tracking</h1>
        <p className="mt-1 text-[#94A3B8]">
          Real-time shipment positions, origin & destination, and ETA — updated live over WebSocket.
        </p>
      </div>
      <Card variant="bordered" className="p-4">
        <LiveMap />
      </Card>
    </div>
  );
};