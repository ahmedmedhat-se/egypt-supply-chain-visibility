import { useQuery } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { useAuthStore } from '../../../store/auth.store';
import { dashboardApi } from '../../../api/dashboard.api';
import { organizationApi } from '../../../api/organization.api';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import {
  FaShip,
  FaUsers,
  FaPaperPlane,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEye,
} from 'react-icons/fa';
import { cn } from '../../../lib/utils';

export const AdminDashboardPage = () => {
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

  const { data: pendingInvites } = useQuery({
    queryKey: ['org-invitations', user?.organizationId],
    queryFn: async () => {
      const res = await organizationApi.getInvitations(user!.organizationId);
      return res.data;
    },
    enabled: !!user?.organizationId,
    staleTime: 0,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <Header user={user} />
        <Card variant="bordered" className="p-8 text-center">
          <p className="text-[#DC2626]">Unable to load dashboard data.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header user={user} />

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Shipments"
          value={stats.totalShipments}
          sub={`${stats.activeShipments} active`}
          icon={FaShip}
          color="text-[#2D9B6E]"
          bg="bg-[#D1FAE5] dark:bg-[#1F7A52]/30"
        />
        <StatCard
          label="Delivered"
          value={stats.deliveredShipments}
          icon={FaCheckCircle}
          color="text-[#065F46]"
          bg="bg-[#D1FAE5] dark:bg-[#1F7A52]/30"
        />
        <StatCard
          label="Delayed"
          value={stats.delayedShipments}
          icon={FaExclamationTriangle}
          color="text-[#DC2626]"
          bg="bg-[#FEE2E2] dark:bg-[#991B1B]/30"
        />
        <StatCard
          label="Team Members"
          value={stats.totalUsers}
          sub={`${stats.activeUsers} active`}
          icon={FaUsers}
          color="text-[#0A2E4A]"
          bg="bg-[#E8F0F8] dark:bg-[#1A3D5A]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipments by Status */}
        <Card variant="bordered">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white">
              Shipments by Status
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SHIPMENTS)}>
              <FaEye className="w-3.5 h-3.5" />
              View all
            </Button>
          </div>
          {Object.keys(stats.shipmentsByStatus).length > 0 ? (
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
            <p className="text-sm text-[#94A3B8]">No shipments yet.</p>
          )}
        </Card>

        {/* Pending Invitations */}
        <Card variant="bordered">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white">
              Pending Invitations
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.ORGANIZATIONS_INVITATIONS)}
            >
              <FaEye className="w-3.5 h-3.5" />
              Manage
            </Button>
          </div>
          {pendingInvites && pendingInvites.length > 0 ? (
            <div className="space-y-3">
              {pendingInvites.slice(0, 5).map((inv) => (
                <div
                  key={inv.invitation_id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FaPaperPlane className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
                    <span className="text-sm text-[#1A2A3A] dark:text-[#E2E8F0] truncate">
                      {inv.invited_email}
                    </span>
                  </div>
                  <Badge
                    variant={inv.invited_role === 'admin' ? 'primary' : 'info'}
                    size="sm"
                  >
                    {inv.invited_role}
                  </Badge>
                </div>
              ))}
              {pendingInvites.length > 5 && (
                <p className="text-xs text-[#94A3B8] text-center">
                  +{pendingInvites.length - 5} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">No pending invitations.</p>
          )}
        </Card>
      </div>

      {/* Alerts Summary */}
      <Card variant="bordered" className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaExclamationTriangle
            className={`w-5 h-5 ${
              stats.criticalAlerts > 0 ? 'text-[#DC2626]' : 'text-[#2D9B6E]'
            }`}
          />
          <span className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0]">
            {stats.criticalAlerts > 0
              ? `${stats.criticalAlerts} critical alert${stats.criticalAlerts > 1 ? 's' : ''} need attention`
              : 'No critical alerts'}
          </span>
        </div>
        <Badge variant={stats.criticalAlerts > 0 ? 'danger' : 'success'} size="sm">
          {stats.totalAlerts} total
        </Badge>
      </Card>
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────────────── */

function Header({ user }: { user: { name: string; organizationName: string } }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
        Welcome back, {user.name}
      </h1>
      <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
        {user.organizationName} &mdash; Admin
      </p>
    </div>
  );
}

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
