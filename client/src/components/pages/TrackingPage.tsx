import { Card } from '../ui/Card';
import { FaMapMarkedAlt } from 'react-icons/fa';

export const TrackingPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Live Tracking</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Real-time shipment tracking on the map</p>
      </div>
      <Card variant="bordered" className="p-12 text-center">
        <FaMapMarkedAlt className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">Interactive Map</h2>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-md mx-auto">
          Live tracking will appear here. View your shipments in real time on an interactive map of Egypt's logistics network.
        </p>
      </Card>
    </div>
  );
};
