import { Card } from '../ui/Card';
import { FaUsersCog, FaUser, FaBuilding, FaChartLine } from 'react-icons/fa';

export const AdminPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Admin Panel</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Platform administration and configuration</p>
      </div>
      <Card variant="bordered" className="p-12 text-center">
        <FaUsersCog className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">Platform Administration</h2>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-md mx-auto">
          Manage users, organizations, system settings, and audit logs from the admin panel.
        </p>
      </Card>
    </div>
  );
};
