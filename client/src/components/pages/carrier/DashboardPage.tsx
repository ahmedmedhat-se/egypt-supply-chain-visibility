import { useQuery } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useAuthStore } from '../../../store/auth.store';
import { dashboardApi } from '../../../api/dashboard.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { FaTruck, FaRoute, FaClipboardCheck, FaShip, FaCheckCircle, FaExclamationTriangle, FaEye } from 'react-icons/fa';
import { cn } from '../../../lib/utils';

export const CarrierDashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await dashboardApi.getStats();
      return res.data;
    },
    refetchInterval: 30_000,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Shipments"
          value={stats?.totalShipments ?? 0}
          sub={`${stats?.activeShipments ?? 0} active`}
          icon={FaShip}
          color="text-[#2D9B6E]"
          bg="bg-[#D1FAE5] dark:bg-[#1F7A52]/30"
        />
        <StatCard
          label="Delivered"
          value={stats?.deliveredShipments ?? 0}
          icon={FaCheckCircle}
          color="text-[#065F46]"
          bg="bg-[#D1FAE5] dark:bg-[#1F7A52]/30"
        />
        <StatCard
          label="In Transit"
          value={stats?.activeShipments ?? 0}
          icon={FaTruck}
          color="text-[#1E40AF]"
          bg="bg-[#DBEAFE] dark:bg-[#1E40AF]/30"
        />
        <StatCard
          label="Delayed"
          value={stats?.delayedShipments ?? 0}
          icon={FaExclamationTriangle}
          color="text-[#DC2626]"
          bg="bg-[#FEE2E2] dark:bg-[#991B1B]/30"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(ROUTES.SHIPMENTS_CARRIER)}
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

      {/* Shipments by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white flex items-center gap-2">
              <FaTruck className="w-5 h-5 text-[#1E40AF]" />
              Shipments by Status
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SHIPMENTS_CARRIER)}>
              <FaEye className="w-3.5 h-3.5" />
              View all
            </Button>
          </div>
          {stats && Object.keys(stats.shipmentsByStatus).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.shipmentsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge
                    variant={
                      status === 'delayed' || status === 'cancelled'
                        ? 'danger'
                        : status === 'delivered'
                          ? 'success'
                          : status === 'customs_hold'
                            ? 'warning'
                            : 'info'
                    }
                  >
                    {status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="font-semibold text-[#0A2E4A] dark:text-white">
                    {String(count)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaTruck className="mx-auto w-10 h-10 text-[#94A3B8] mb-3" />
              <p className="text-sm text-[#94A3B8]">
                Once you have assigned shipments, they will appear here with status breakdowns.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(ROUTES.SHIPMENTS_CARRIER)}
              >
                Browse Available Shipments
              </Button>
            </div>
          )}
        </Card>

        {/* Alerts Summary */}
        <Card variant="bordered">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white flex items-center gap-2">
              <FaExclamationTriangle className="w-5 h-5 text-[#92400E]" />
              Alerts & Notifications
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ALERTS)}>
              <FaEye className="w-3.5 h-3.5" />
              View all
            </Button>
          </div>
          {stats && stats.totalAlerts > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FEF3C7] dark:bg-[#92400E]/20">
                <span className="text-sm font-medium text-[#92400E] dark:text-[#FBBF24]">
                  Total Alerts
                </span>
                <Badge variant="warning" size="sm">{stats.totalAlerts}</Badge>
              </div>
              {stats.criticalAlerts > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FEE2E2] dark:bg-[#991B1B]/20">
                  <span className="text-sm font-medium text-[#DC2626]">
                    Critical Alerts
                  </span>
                  <Badge variant="danger" size="sm">{stats.criticalAlerts}</Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaExclamationTriangle className="mx-auto w-10 h-10 text-[#94A3B8] mb-3" />
              <p className="text-sm text-[#94A3B8]">
                No alerts at the moment. You'll be notified of any issues with your shipments.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────────────── */

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}) {
  return (
    <Card variant="elevated" className="group hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            bg,
          )}
        >
          <Icon className={cn('w-6 h-6', color)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
            {value}
          </p>
          <p className="text-sm text-[#94A3B8]">{label}</p>
          {sub && <p className="text-xs text-[#2D9B6E]">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}
