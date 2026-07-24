import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useAuthStore } from '../../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { FaTruck, FaRoute, FaClipboardCheck, FaClock, FaMapMarkedAlt } from 'react-icons/fa';

export const CarrierDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
          Welcome, {user.name}
        </h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {user.organizationName} &mdash; Carrier
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(ROUTES.SHIPMENTS)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1A3D8F] p-6 text-white text-left hover:shadow-xl transition-all duration-300"
        >
          <div className="relative z-10">
            <FaTruck className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-1">Assigned Shipments</h3>
            <p className="text-sm text-white/70">View shipments assigned to you</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>

        <button
          onClick={() => navigate(ROUTES.TRACKING)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] p-6 text-white text-left hover:shadow-xl transition-all duration-300"
        >
          <div className="relative z-10">
            <FaRoute className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-1">Active Routes</h3>
            <p className="text-sm text-white/70">Track your in-transit cargo</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>

        <button
          onClick={() => navigate(ROUTES.ALERTS)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#92400E] to-[#78350F] p-6 text-white text-left hover:shadow-xl transition-all duration-300"
        >
          <div className="relative z-10">
            <FaClipboardCheck className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-lg font-semibold mb-1">Checkpoint Updates</h3>
            <p className="text-sm text-white/70">Log progress at each checkpoint</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered" className="p-6">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-3 flex items-center gap-2">
            <FaTruck className="w-5 h-5 text-[#1E40AF]" />
            Your Fleet Overview
          </h2>
          <p className="text-sm text-[#94A3B8]">
            Once you have assigned shipments, they will appear here with route details,
            estimated times, and checkpoint information.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#94A3B8]">
            <FaClock className="w-4 h-4" />
            <span>No active shipments yet</span>
          </div>
        </Card>

        <Card variant="bordered" className="p-6">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-3 flex items-center gap-2">
            <FaMapMarkedAlt className="w-5 h-5 text-[#2D9B6E]" />
            Recent Updates
          </h2>
          <p className="text-sm text-[#94A3B8]">
            Status updates and checkpoint events for your shipments will be shown here
            in real-time.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#94A3B8]">
            <FaClock className="w-4 h-4" />
            <span>No recent updates</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
