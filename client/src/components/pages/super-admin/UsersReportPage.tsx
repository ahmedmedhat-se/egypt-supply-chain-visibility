import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../ui/Table';
import { adminApi } from '../../../api/admin.api';
import { formatDate, cn } from '../../../lib/utils';
import {
  FaUsers,
  FaEnvelope,
  FaPaperPlane,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from 'react-icons/fa';

type Tab = 'users' | 'invitations';

export const SuperAdminUsersReportPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Platform Users Report</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          View all platform users and invitations
        </p>
      </div>

      <div className="flex gap-1 border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
        {([{ key: 'users' as Tab, label: 'Users' }, { key: 'invitations' as Tab, label: 'Invitations' }]).map((tab) => (
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

      {activeTab === 'users' && <AllUsersTable />}
      {activeTab === 'invitations' && <AllInvitationsTable />}
    </div>
  );
};

/* ─── All Users Table ────────────────────────────────────────── */

function AllUsersTable() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter],
    queryFn: async () => {
      const res = await adminApi.getUsers({ page, limit, search: search || undefined, role: roleFilter || undefined });
      return res.data;
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#94A3B8] py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0A2E4A] text-white flex items-center justify-center text-sm font-medium">
                          {u.user_first_name.charAt(0)}{u.user_last_name.charAt(0)}
                        </div>
                        {u.user_first_name} {u.user_last_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">{u.user_email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.user_role === 'super_admin' ? 'danger'
                            : u.user_role === 'admin' ? 'primary'
                              : u.user_role === 'carrier' ? 'warning'
                                : 'info'
                        }
                        size="sm"
                      >
                        {u.user_role.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">
                      {u.organization?.organization_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      {u.user_is_active ? (
                        <span className="inline-flex items-center gap-1 text-sm text-[#065F46]">
                          <FaCheckCircle className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-[#94A3B8]">
                          <FaTimesCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#94A3B8] text-sm">
                      {formatDate(u.user_created_at)}
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

/* ─── All Invitations Table ──────────────────────────────────── */

function AllInvitationsTable() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-invitations', page, statusFilter],
    queryFn: async () => {
      const res = await adminApi.getInvitations({ page, limit, status: statusFilter || undefined });
      return res.data;
    },
  });

  const invitations = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-[#D1D9E6] text-sm text-[#1A2A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2E4A]"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="expired">Expired</option>
        </select>
        <p className="text-xs text-[#94A3B8]">
          {meta ? `${meta.total} total invitation${meta.total !== 1 ? 's' : ''}` : ''}
        </p>
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
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#94A3B8] py-8">
                    No invitations found.
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((inv) => {
                  const expiresAt = new Date(inv.expires_at);
                  const isExpired = expiresAt <= new Date();
                  return (
                    <TableRow key={inv.invitation_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="w-4 h-4 text-[#94A3B8]" />
                          {inv.invited_email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={inv.invited_role === 'admin' ? 'primary' : 'info'}
                          size="sm"
                        >
                          {inv.invited_role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#94A3B8]">
                        {inv.organization.organization_name}
                      </TableCell>
                      <TableCell>
                        {inv.status === 'accepted' ? (
                          <span className="inline-flex items-center gap-1 text-sm text-[#065F46]">
                            <FaCheckCircle className="w-3.5 h-3.5" />
                            Accepted
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-sm text-[#DC2626]">
                            <FaTimesCircle className="w-3.5 h-3.5" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-[#92400E]">
                            <FaClock className="w-3.5 h-3.5" />
                            Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-[#94A3B8] text-sm">
                        {inv.created_by.user_first_name} {inv.created_by.user_last_name}
                      </TableCell>
                      <TableCell className="text-[#94A3B8] text-sm">
                        {formatDate(inv.created_at)}
                      </TableCell>
                      <TableCell className="text-[#94A3B8] text-sm">
                        {formatDate(inv.expires_at)}
                      </TableCell>
                    </TableRow>
                  );
                })
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
