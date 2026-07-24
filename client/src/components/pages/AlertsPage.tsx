import { Card } from '../ui/Card';
import { FaBell } from 'react-icons/fa';

export const AlertsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Alerts</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Your notification center</p>
      </div>
      <Card variant="bordered" className="p-12 text-center">
        <FaBell className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">Alert Center</h2>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-md mx-auto">
          Alerts and notifications will appear here. You'll be notified about delays, customs holds, and status changes.
        </p>
      </Card>
    </div>
  );
};
