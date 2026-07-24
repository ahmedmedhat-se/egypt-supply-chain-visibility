import { Card } from '../ui/Card';
import { FaCog } from 'react-icons/fa';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Settings</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Application preferences and configuration</p>
      </div>
      <Card variant="bordered" className="p-12 text-center">
        <FaCog className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">Application Settings</h2>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-md mx-auto">
          Theme preferences, notification settings, and account configuration will be available here.
        </p>
      </Card>
    </div>
  );
};
