import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../ui/Table';
import { adminApi } from '../../api/admin.api';
import { formatDate, cn } from '../../lib/utils';
import {
  FaBuilding,
  FaUsers,
  FaShip,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTrash,
  FaBan,
} from 'react-icons/fa';

type Tab = 'overview' | 'users' | 'organizations' | 'audit-logs';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'organizations', label: 'Organizations' },
  { key: 'audit-logs', label: 'Audit Logs' },
];

export const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Platform Administration</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          System-wide management of users, organizations, shipments, and audit logs
        </p>
      </div>

      <div className="flex gap-1 border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab.key
                ? 'text-[#0A2E4A] dark:text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#2D9B6E]'
                : 'text-[#94A3B8] hover:text-[#0A2E4A] dark:hover:text-white',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'organizations' && <OrganizationsTab />}
      {activeTab === 'audit-logs' && <AuditLogsTab />}
    </div>
  );
};

/* ─── Overview Tab ──────────────────────────────────────────── */

function OverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await adminApi.getDashboard();
      return res.data.data;
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card variant="bordered" className="p-8 text-center">
        <p className="text-[#DC2626]">Unable to load dashboard data.</p>
      </Card>
    );
  }

  const statCards = [
    {
      label: 'Total Organizations',
      value: data.organizations.total,
      sub: `${data.organizations.active} active`,
      icon: FaBuilding,
      color: 'text-[#2D9B6E]',
      bg: 'bg-[#D1FAE5] dark:bg-[#1F7A52]/30',
    },
    {
      label: 'Total Users',
      value: data.users.total,
      sub: `${data.users.active} active`,
      icon: FaUsers,
      color: 'text-[#0A2E4A]',
      bg: 'bg-[#E8F0F8] dark:bg-[#1A3D5A]',
    },
    {
      label: 'Total Shipments',
      value: data.shipments.total,
      icon: FaShip,
      color: 'text-[#065F46]',
      bg: 'bg-[#D1FAE5] dark:bg-[#1F7A52]/30',
    },
    {
      label: 'Critical Alerts',
      value: data.alerts.critical,
      sub: `${data.alerts.total} total alerts`,
      icon: FaExclamationTriangle,
      color: 'text-[#DC2626]',
      bg: 'bg-[#FEE2E2] dark:bg-[#991B1B]/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          {data.shipments.byStatus.length > 0 ? (
            <div className="space-y-3">
              {data.shipments.byStatus.map((s) => (
                <div key={s.shipment_status} className="flex items-center justify-between">
                  <Badge
                    variant={
                      s.shipment_status === 'delayed' || s.shipment_status === 'cancelled'
                        ? 'danger'
                        : s.shipment_status === 'delivered'
                          ? 'success'
                          : s.shipment_status === 'customs_hold'
                            ? 'warning'
                            : 'info'
                    }
                  >
                    {s.shipment_status.replace(/_/g, ' ')}
                  </Badge>
                  <span className="font-semibold text-[#0A2E4A] dark:text-white">
                    {String(s._count)}
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
            System Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A2A3A] dark:text-[#E2E8F0]">Organizations</span>
              <span className="text-sm font-semibold text-[#0A2E4A] dark:text-white">
                {data.organizations.active} / {data.organizations.total} active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A2A3A] dark:text-[#E2E8F0]">Users</span>
              <span className="text-sm font-semibold text-[#0A2E4A] dark:text-white">
                {data.users.active} / {data.users.total} active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A2A3A] dark:text-[#E2E8F0]">Alerts</span>
              <span className="text-sm font-semibold text-[#0A2E4A] dark:text-white">
                <span className="text-[#DC2626]">{data.alerts.critical} critical</span> / {data.alerts.total} total
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#1A2A3A] dark:text-[#E2E8F0]">Total Shipments</span>
              <span className="text-sm font-semibold text-[#0A2E4A] dark:text-white">
                {data.shipments.total}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─── Users Tab ─────────────────────────────────────────────── */

function UsersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: async () => {
      const res = await adminApi.getUsers({ page, limit, search: search || undefined, role: roleFilter || undefined });
      return res.data;
    },
  });

  const userMutate = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'activate' | 'deactivate' | 'delete' }) => {
      if (action === 'activate') return adminApi.activateUser(id);
      if (action === 'deactivate') return adminApi.deactivateUser(id);
      return adminApi.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[#D1D9E6] text-sm text-[#1A2A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2E4A]"
        >
          <option value="">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="shipper">Shipper</option>
          <option value="carrier">Carrier</option>
          <option value="regulator">Regulator</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card variant="bordered" padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#94A3B8] py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      {u.user_first_name} {u.user_last_name}
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">{u.user_email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.user_role === 'super_admin' ? 'danger'
                            : u.user_role === 'admin' ? 'primary'
                              : 'info'
                        }
                        size="sm"
                      >
                        {u.user_role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">
                      {u.organization?.organization_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.user_is_active ? 'success' : 'warning'} size="sm" dot>
                        {u.user_is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#94A3B8] text-sm">
                      {formatDate(u.user_created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.user_is_active ? (
                          <button
                            onClick={() => userMutate.mutate({ id: u.user_id, action: 'deactivate' })}
                            className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                            title="Deactivate"
                          >
                            <FaBan className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => userMutate.mutate({ id: u.user_id, action: 'activate' })}
                            className="p-1.5 rounded-lg text-[#2D9B6E] hover:bg-[#D1FAE5] transition-colors"
                            title="Activate"
                          >
                            <FaCheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to permanently delete this user?')) {
                              userMutate.mutate({ id: u.user_id, action: 'delete' });
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#94A3B8]">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Organizations Tab ─────────────────────────────────────── */

function OrganizationsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-organizations', page, search, typeFilter],
    queryFn: async () => {
      const res = await adminApi.getOrganizations({
        page,
        limit,
        search: search || undefined,
        type: typeFilter || undefined,
      });
      return res.data;
    },
  });

  const deactivateMutate = useMutation({
    mutationFn: (id: string) => adminApi.deactivateOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
  });

  const orgs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-64">
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[#D1D9E6] text-sm text-[#1A2A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2E4A]"
        >
          <option value="">All types</option>
          <option value="shipper">Shipper</option>
          <option value="carrier">Carrier</option>
          <option value="regulator">Regulator</option>
          <option value="logistics">Logistics</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card variant="bordered" padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#94A3B8] py-8">
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                orgs.map((o) => (
                  <TableRow key={o.organization_id}>
                    <TableCell className="font-medium">{o.organization_name}</TableCell>
                    <TableCell>
                      <Badge variant="info" size="sm">{o.organization_type}</Badge>
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">{o.users.length}</TableCell>
                    <TableCell>
                      <Badge variant={o.organization_is_active ? 'success' : 'warning'} size="sm" dot>
                        {o.organization_is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#94A3B8] text-sm">
                      {formatDate(o.organization_created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {o.organization_is_active && (
                        <button
                          onClick={() => deactivateMutate.mutate(o.organization_id)}
                          className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                          title="Deactivate"
                        >
                          <FaBan className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#94A3B8]">
            Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Audit Logs Tab ────────────────────────────────────────── */

function AuditLogsTab() {
  const [resourceType, setResourceType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', resourceType],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({
        resourceType: resourceType || undefined,
        limit: 50,
      });
      return res.data.data;
    },
    refetchInterval: 15_000,
  });

  const logs = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[#D1D9E6] text-sm text-[#1A2A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2E4A]"
        >
          <option value="">All resource types</option>
          <option value="user">User</option>
          <option value="organization">Organization</option>
          <option value="shipment">Shipment</option>
        </select>
        <p className="text-xs text-[#94A3B8]">Showing up to 50 most recent entries</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card variant="bordered" padding="none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#94A3B8] py-8">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.audit_log_id}>
                    <TableCell>
                      <Badge
                        variant={
                          log.audit_action.startsWith('DELETE') ? 'danger'
                            : log.audit_action.startsWith('CREATE') ? 'success'
                              : 'info'
                        }
                        size="sm"
                      >
                        {log.audit_action.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">{log.audit_resource_type}</TableCell>
                    <TableCell className="text-[#94A3B8] font-mono text-xs">
                      {log.audit_resource_id ? log.audit_resource_id.slice(0, 12) + '…' : '—'}
                    </TableCell>
                    <TableCell>
                      {log.user.user_first_name} {log.user.user_last_name}
                      <span className="text-[#94A3B8] ml-1">({log.user.user_email})</span>
                    </TableCell>
                    <TableCell className="text-[#94A3B8] text-sm">
                      {formatDate(log.audit_performed_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
