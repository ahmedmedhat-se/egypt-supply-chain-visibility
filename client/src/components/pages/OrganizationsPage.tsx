import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { organizationApi } from '../../api/organization.api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { FaUsers, FaEnvelope, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { formatDate } from '../../lib/utils';

const roleBadgeVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'primary'> = {
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

  const {
    data: members,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      const res = await organizationApi.getMembers(orgId!);
      return res.data;
    },
    enabled: !!orgId,
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
        <Card variant="bordered" className="p-8 text-center">
          <FaTimesCircle className="mx-auto w-10 h-10 text-[#DC2626] mb-3" />
          <p className="text-[#DC2626] font-medium">Unable to load team members</p>
          <p className="text-sm text-[#94A3B8] mt-1">
            Make sure the backend is running and you have the right permissions.
          </p>
        </Card>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="space-y-6">
        <Header orgName={orgName} memberCount={0} />
        <Card variant="bordered" className="p-12 text-center">
          <FaUsers className="mx-auto w-12 h-12 text-[#94A3B8] mb-4" />
          <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-1">
            No team members yet
          </h3>
          <p className="text-sm text-[#94A3B8] max-w-sm mx-auto">
            Your organization doesn't have any members yet. Invite colleagues to get started.
          </p>
        </Card>
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.user_is_active);
  const invitedCount = members.length - activeMembers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header orgName={orgName} memberCount={members.length} />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center">
            <FaUsers className="w-6 h-6 text-[#065F46]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{members.length}</p>
            <p className="text-sm text-[#94A3B8]">Total members</p>
          </div>
        </Card>

        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] dark:bg-[#1E40AF]/30 flex items-center justify-center">
            <FaCheckCircle className="w-6 h-6 text-[#1E40AF]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{activeMembers.length}</p>
            <p className="text-sm text-[#94A3B8]">Active</p>
          </div>
        </Card>

        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] dark:bg-[#92400E]/30 flex items-center justify-center">
            <FaEnvelope className="w-6 h-6 text-[#92400E]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{invitedCount}</p>
            <p className="text-sm text-[#94A3B8]">Pending invites</p>
          </div>
        </Card>
      </div>

      {/* Members Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.user_id}
                  className="border-b border-[#E2E8F0] dark:border-[#334155] last:border-b-0 hover:bg-[#F8FAFC] dark:hover:bg-[#1A3D5A]/50 transition-colors"
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0A2E4A] text-white flex items-center justify-center text-sm font-medium">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-6 py-4 whitespace-nowrap">
      {children}
    </td>
  );
}
