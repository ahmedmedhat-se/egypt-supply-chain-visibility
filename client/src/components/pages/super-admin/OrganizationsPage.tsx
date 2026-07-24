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
import { FaBuilding, FaGlobe, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export const SuperAdminOrganizationsPage = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-organizations', page, search, typeFilter],
    queryFn: async () => {
      const res = await adminApi.getOrganizations({
        page, limit,
        search: search || undefined,
        type: typeFilter || undefined,
      });
      return res.data;
    },
  });

  const orgs = data?.data ?? [];
  const meta = data?.meta;

  const totalOrgs = meta?.total ?? 0;
  const activeOrgs = orgs.filter((o) => o.organization_is_active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Organizations</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {totalOrgs} organization{totalOrgs !== 1 ? 's' : ''} on the platform
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center">
            <FaBuilding className="w-6 h-6 text-[#065F46]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{totalOrgs}</p>
            <p className="text-sm text-[#94A3B8]">Total organizations</p>
          </div>
        </Card>
        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] dark:bg-[#1E40AF]/30 flex items-center justify-center">
            <FaGlobe className="w-6 h-6 text-[#1E40AF]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{activeOrgs}</p>
            <p className="text-sm text-[#94A3B8]">Active</p>
          </div>
        </Card>
        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] dark:bg-[#991B1B]/30 flex items-center justify-center">
            <FaTimesCircle className="w-6 h-6 text-[#991B1B]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
              {totalOrgs - activeOrgs}
            </p>
            <p className="text-sm text-[#94A3B8]">Inactive</p>
          </div>
        </Card>
      </div>

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
          <option value="admin">Admin</option>
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
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#94A3B8] py-8">
                    No organizations found.
                  </TableCell>
                </TableRow>
              ) : (
                orgs.map((o) => (
                  <TableRow key={o.organization_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0A2E4A] text-white flex items-center justify-center text-sm font-bold">
                          {o.organization_name.charAt(0)}
                        </div>
                        {o.organization_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.organization_type === 'shipper' ? 'info'
                            : o.organization_type === 'carrier' ? 'warning'
                              : o.organization_type === 'regulator' ? 'default'
                                : 'primary'
                        }
                        size="sm"
                      >
                        {o.organization_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#94A3B8]">{o.organization_email ?? '—'}</TableCell>
                    <TableCell className="text-[#94A3B8]">{o.organization_country ?? '—'}</TableCell>
                    <TableCell className="text-[#94A3B8]">{o.users.length}</TableCell>
                    <TableCell>
                      {o.organization_is_active ? (
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
                      {formatDate(o.organization_created_at)}
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
};
