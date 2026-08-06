import { useAuthStore } from '../../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { FaShip, FaPlus, FaSearch, FaClock, FaCheckCircle } from 'react-icons/fa';

export const ShipperDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
          Welcome, {user.name}
        </h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {user.organizationName} &mdash; Shipper
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(ROUTES.SHIPMENT_CREATE)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2D9B6E] to-[#1F7A52] dark:from-[#1A5A3E] dark:to-[#0F3A28] p-6 text-white text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FaPlus className="w-6 h-6 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Create Shipment</h3>
            <p className="text-sm text-white/70">Send cargo to a destination</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>

        <button
          onClick={() => navigate(ROUTES.TRACKING)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1A3D8F] dark:from-[#0A1A4A] dark:to-[#050D2A] p-6 text-white text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FaSearch className="w-6 h-6 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Track Shipment</h3>
            <p className="text-sm text-white/70">Follow your cargo in real-time</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>

        <button
          onClick={() => navigate(ROUTES.SHIPMENTS)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0A2E4A] to-[#122A44] dark:from-black dark:to-[#0A0A0A] p-6 text-white text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FaShip className="w-6 h-6 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-1">My Shipments</h3>
            <p className="text-sm text-white/70">View all your shipments</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-3">
            Getting Started
          </h2>
          <ul className="space-y-3">
            {[
              { icon: FaPlus, text: 'Create a new shipment to send cargo' },
              { icon: FaSearch, text: 'Track your active shipments in real-time' },
              { icon: FaCheckCircle, text: 'Get notified when cargo reaches checkpoints' },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-[#64748B] dark:text-[#94A3B8]">
                <div className="w-8 h-8 rounded-full bg-[#E8F0F8] dark:bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="w-4 h-4 text-[#0A2E4A] dark:text-white" />
                </div>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-3">
            Recent Activity
          </h2>
          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            Your recent shipments and updates will appear here once you start shipping cargo.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            <div className="w-6 h-6 rounded-lg bg-[#E8F0F8] dark:bg-[#1A1A1A] flex items-center justify-center">
              <FaClock className="w-3 h-3" />
            </div>
            <span>No recent activity</span>
          </div>
        </div>
      </div>
    </div>
  );
};