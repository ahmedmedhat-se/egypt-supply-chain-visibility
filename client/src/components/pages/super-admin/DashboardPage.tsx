import { useQuery } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { Badge } from '../../ui/Badge';
import { useAuthStore } from '../../../store/auth.store';
import { dashboardApi } from '../../../api/dashboard.api';
import {
  FaShip,
  FaUsers,
  FaBuilding,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import { cn } from '../../../lib/utils';

export const SuperAdminDashboardPage = () => {
  const user = useAuthStore((state) => state.user);

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

  if (!stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Platform Dashboard</h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Welcome back, {user.name}</p>
        </div>
        <Card variant="bordered" className="p-8 text-center">
          <p className="text-[#DC2626]">Unable to load dashboard data.</p>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Shipments',
      value: stats.totalShipments,
      sub: `${stats.activeShipments} active`,
      icon: FaShip,
      color: 'text-[#2D9B6E]',
      bg: 'bg-[#D1FAE5] dark:bg-[#1F7A52]/30',
    },
    {
      label: 'Delivered',
      value: stats.deliveredShipments,
      icon: FaCheckCircle,
      color: 'text-[#065F46]',
      bg: 'bg-[#D1FAE5] dark:bg-[#1F7A52]/30',
    },
    {
      label: 'Delayed',
      value: stats.delayedShipments,
      icon: FaExclamationTriangle,
      color: 'text-[#DC2626]',
      bg: 'bg-[#FEE2E2] dark:bg-[#991B1B]/30',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      sub: `${stats.activeUsers} active`,
      icon: FaUsers,
      color: 'text-[#0A2E4A]',
      bg: 'bg-[#E8F0F8] dark:bg-[#1A3D5A]',
    },
    {
      label: 'Organizations',
      value: stats.totalOrganizations,
      sub: `${stats.activeOrganizations} active`,
      icon: FaBuilding,
      color: 'text-[#1E40AF]',
      bg: 'bg-[#DBEAFE] dark:bg-[#1E40AF]/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
          Platform Dashboard
        </h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          Welcome back, {user.name} — Super Admin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} variant="elevated" className="group hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{stat.value}</p>
                <p className="text-sm text-[#94A3B8]">{stat.label}</p>
                {stat.sub && <p className="text-xs text-[#2D9B6E]">{stat.sub}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="bordered">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-4">
            Shipments by Status
          </h2>
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

        <Card variant="bordered">
          <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-4">
            Users by Role
          </h2>
          {Object.keys(stats.usersByRole).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] capitalize">
                    {role.replace(/_/g, ' ')}
                  </span>
                  <span className="font-semibold text-[#0A2E4A] dark:text-white">
                    {String(count)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8]">No users yet.</p>
          )}
        </Card>
      </div>

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
