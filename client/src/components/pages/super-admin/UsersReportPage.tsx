import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Pagination } from '../../ui/Pagination';
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
import { formatDate } from '../../../lib/utils';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaTrash,
} from 'react-icons/fa';

export const SuperAdminUsersReportPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
          Platform Users Report
        </h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          View and manage all platform users
        </p>
      </div>

      <AllUsersTable />
    </div>
  );
};

/* ─── All Users Table ────────────────────────────────────────── */

function AllUsersTable() {
  const queryClient = useQueryClient();
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

  const userMutate = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'activate' | 'deactivate' | 'delete' }) => {
      if (action === 'activate') return adminApi.activateUser(id);
      if (action === 'deactivate') return adminApi.deactivateUser(id);
      return adminApi.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
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

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          limit={meta.limit}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
