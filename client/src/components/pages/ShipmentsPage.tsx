import { Card } from '../ui/Card';
import { FaShip } from 'react-icons/fa';
import { useAuthStore } from '../../store/auth.store';

export const ShipmentsPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Shipments</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {user?.organizationName ? `${user.organizationName} — ` : ''}Manage your shipments
        </p>
      </div>
      <Card variant="bordered" className="p-12 text-center">
        <FaShip className="w-16 h-16 mx-auto mb-4 text-[#94A3B8]" />
        <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">Shipment Management</h2>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-md mx-auto">
          This feature is coming soon. You'll be able to create, track, and manage all your shipments from here.
        </p>
      </Card>
    </div>
  );
};
