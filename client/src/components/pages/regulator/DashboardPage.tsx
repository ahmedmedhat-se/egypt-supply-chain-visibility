import { useAuthStore } from '../../../store/auth.store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { FaGavel, FaFileAlt, FaSearch, FaClock, FaExclamationTriangle } from 'react-icons/fa';

export const RegulatorDashboardPage = () => {
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
          {user.organizationName} &mdash; Regulator
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(ROUTES.SHIPMENTS)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0A2E4A] to-[#122A44] dark:from-black dark:to-[#0A0A0A] p-6 text-white text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FaSearch className="w-6 h-6 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Inspect Shipments</h3>
            <p className="text-sm text-white/70">Review cargo and documentation</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>

        <button
          onClick={() => navigate(ROUTES.ALERTS)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#92400E] to-[#78350F] dark:from-[#4A1A0A] dark:to-[#2A0A05] p-6 text-white text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FaExclamationTriangle className="w-6 h-6 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Compliance Alerts</h3>
            <p className="text-sm text-white/70">Flagged shipments and issues</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>

        <button
          onClick={() => navigate(ROUTES.REPORTS)}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#1A3D8F] dark:from-[#0A1A4A] dark:to-[#050D2A] p-6 text-white text-left hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <FaFileAlt className="w-6 h-6 opacity-80" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Reports</h3>
            <p className="text-sm text-white/70">Generate compliance reports</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E8F0F8] dark:bg-[#1A1A1A] flex items-center justify-center">
              <FaGavel className="w-4 h-4 text-[#0A2E4A] dark:text-white" />
            </div>
            Regulatory Overview
          </h2>
          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            Monitor shipments passing through regulatory checkpoints, review customs
            documentation, and track compliance status across your region.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            <div className="w-6 h-6 rounded-lg bg-[#E8F0F8] dark:bg-[#1A1A1A] flex items-center justify-center">
              <FaClock className="w-3 h-3" />
            </div>
            <span>No active compliance items</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] dark:bg-[#1A1A1A] flex items-center justify-center">
              <FaFileAlt className="w-4 h-4 text-[#1E40AF] dark:text-white" />
            </div>
            Recent Reports
          </h2>
          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            Generated reports and data summaries will appear here for your review.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-[#94A3B8] dark:text-[#94A3B8]">
            <div className="w-6 h-6 rounded-lg bg-[#E8F0F8] dark:bg-[#1A1A1A] flex items-center justify-center">
              <FaClock className="w-3 h-3" />
            </div>
            <span>No reports yet</span>
          </div>
        </div>
      </div>
    </div>
  );
};