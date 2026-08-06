import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { organizationApi } from '../../api/organization.api';
import type { OrgMember } from '../../types/organization.types';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { showToast } from '../ui/Toast';
import { extractErrorMessage } from '../../api/client';
import { FaUsers, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaBan } from 'react-icons/fa';
import { formatDate, cn } from '../../lib/utils';

const roleBadgeVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'primary' | 'default'> = {
  super_admin: 'danger',
  admin: 'primary',
  shipper: 'info',
  carrier: 'warning',
  regulator: 'default',
};

export const OrganizationsPage = () => {
  const user = useAuthStore((state) => state.user);
  const orgId = user?.organizationId;
  const orgName = user?.organizationName;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: membersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['org-members', orgId, page],
    queryFn: async () => {
      const res = await organizationApi.getMembers(orgId!, { page, limit });
      return res.data;
    },
    enabled: !!orgId,
  });

  const members: OrgMember[] = Array.isArray(membersData?.data) ? membersData!.data : [];
  const meta = membersData?.meta;

  const { data: activeCount = 0 } = useQuery({
    queryKey: ['org-members-active', orgId],
    queryFn: async () => {
      const res = await organizationApi.getMembers(orgId!, {
        page: 1,
        limit: 1,
        isActive: true,
      });
      return res.data.meta.totalItems;
    },
    enabled: !!orgId,
  });

  const memberMutate = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'activate' | 'deactivate' }) => {
      if (action === 'activate') return organizationApi.activateMember(orgId!, userId);
      return organizationApi.deactivateMember(orgId!, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      queryClient.invalidateQueries({ queryKey: ['org-members-active', orgId] });
      showToast.success('Member status updated');
    },
    onError: (err: unknown) => {
      showToast.error(extractErrorMessage(err));
    },
  });

  if (!user || !orgId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header orgName={orgName} memberCount={0} />
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-8 text-center shadow-sm">
          <FaTimesCircle className="mx-auto w-10 h-10 text-[#DC2626] mb-3" />
          <p className="text-[#DC2626] font-medium">Unable to load team members</p>
          <p className="text-sm text-[#94A3B8] mt-1">
            Make sure the backend is running and you have the right permissions.
          </p>
        </div>
      </div>
    );
  }

  if (members.length === 0 && meta?.totalItems === 0) {
    return (
      <div className="space-y-6">
        <Header orgName={orgName} memberCount={0} />
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-12 text-center shadow-sm">
          <FaUsers className="mx-auto w-12 h-12 text-[#94A3B8] mb-4" />
          <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-1">
            No team members yet
          </h3>
          <p className="text-sm text-[#94A3B8] max-w-sm mx-auto">
            Your organization doesn't have any members yet. Invite colleagues to get started.
          </p>
        </div>
      </div>
    );
  }

  const totalMembers = meta?.totalItems ?? members.length;
  const inactiveCount = Math.max(0, totalMembers - activeCount);

  return (
    <div className="space-y-6">
      <Header orgName={orgName} memberCount={totalMembers} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center">
            <FaUsers className="w-6 h-6 text-[#065F46]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{totalMembers}</p>
            <p className="text-sm text-[#94A3B8]">Total members</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] dark:bg-[#1E40AF]/30 flex items-center justify-center">
            <FaCheckCircle className="w-6 h-6 text-[#1E40AF]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{activeCount}</p>
            <p className="text-sm text-[#94A3B8]">Active</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] dark:bg-[#991B1B]/30 flex items-center justify-center">
            <FaBan className="w-6 h-6 text-[#991B1B]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{inactiveCount}</p>
            <p className="text-sm text-[#94A3B8]">Inactive</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#2A2A2A] bg-[#F8FAFC] dark:bg-[#0A0A0A]">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.user_id}
                  className={`
                    border-b border-[#E2E8F0] dark:border-[#2A2A2A] last:border-b-0
                    transition-colors
                    ${member.user_is_active ? 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A]' : ''}
                    ${!member.user_is_active ? 'opacity-60' : ''}
                  `}
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${member.user_is_active ? 'bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white' : 'bg-[#D1D9E6] dark:bg-[#2A2A2A] text-[#94A3B8]'}`}>
                        {member.user_first_name.charAt(0)}{member.user_last_name.charAt(0)}
                      </div>
                      <span className="font-medium text-[#0A2E4A] dark:text-white">
                        {member.user_first_name} {member.user_last_name}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                      {member.user_email}
                    </span>
                  </Td>
                  <Td>
                    <Badge variant={roleBadgeVariant[member.user_role] || 'default'} size="sm">
                      {member.user_role.replace(/_/g, ' ')}
                    </Badge>
                  </Td>
                  <Td>
                    {member.user_is_active ? (
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
                  </Td>
                  <Td>
                    <span className="text-sm text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5">
                      <FaCalendarAlt className="w-3 h-3" />
                      {formatDate(member.user_created_at)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    {member.user_id !== user.id && (
                      <div className="flex items-center justify-end gap-1">
                        {member.user_is_active ? (
                          <button
                            onClick={() => memberMutate.mutate({ userId: member.user_id, action: 'deactivate' })}
                            className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/20 transition-colors"
                            title="Deactivate"
                          >
                            <FaBan className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => memberMutate.mutate({ userId: member.user_id, action: 'activate' })}
                            className="p-1.5 rounded-lg text-[#2D9B6E] hover:bg-[#D1FAE5] dark:hover:bg-[#1F7A52]/30 transition-colors"
                            title="Activate"
                          >
                            <FaCheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {meta && (
        <Pagination
          page={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          limit={meta.limit}
          onPageChange={setPage}
          className="px-1"
        />
      )}
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────────────── */

function Header({ orgName, memberCount }: { orgName?: string; memberCount: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Team Members</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {orgName || 'Organization'} &mdash; {memberCount} member{memberCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-6 py-3 text-left text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap', className)}>
      {children}
    </td>
  );
}