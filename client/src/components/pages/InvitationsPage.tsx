import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { organizationApi } from '../../api/organization.api';
import { extractErrorMessage } from '../../api/client';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { showToast } from '../ui/Toast';
import { InviteMemberModal } from '../invitations/InviteMemberModal';
import {
  FaEnvelope,
  FaUserPlus,
  FaClock,
  FaBan,
  FaRedo,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPaperPlane,
} from 'react-icons/fa';
import { formatDate } from '../../lib/utils';

const roleBadgeVariant: Record<string, 'info' | 'warning' | 'danger' | 'primary'> = {
  admin: 'primary',
  shipper: 'info',
  carrier: 'warning',
  regulator: 'default',
};

export const InvitationsPage = () => {
  const user = useAuthStore((state) => state.user);
  const orgId = user?.organizationId;
  const orgName = user?.organizationName;
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);

  /* ───── Fetch pending invitations ───── */

  const {
    data: invitations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['org-invitations', orgId],
    queryFn: async () => {
      const res = await organizationApi.getInvitations(orgId!);
      return res.data;
    },
    enabled: !!orgId,
    staleTime: 0,           // always refetch on mount (catches accepted invites)
    refetchInterval: 30_000, // auto-refresh every 30s
  });

  /* ───── Resend mutation ───── */

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) =>
      organizationApi.resendInvitation(orgId!, invitationId),
    onSuccess: () => {
      showToast.success('Invitation resent successfully');
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
    onError: (err: unknown) => {
      showToast.error(extractErrorMessage(err));
    },
  });

  /* ───── Cancel mutation ───── */

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) =>
      organizationApi.cancelInvitation(orgId!, invitationId),
    onSuccess: () => {
      showToast.success('Invitation cancelled');
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
    },
    onError: (err: unknown) => {
      showToast.error(extractErrorMessage(err));
    },
  });

  /* ───── Guard / Loading / Error / Empty states ───── */

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
        <Header
          orgName={orgName}
          pendingCount={0}
          onInvite={() => setShowInviteModal(true)}
        />
        <Card variant="bordered" className="p-8 text-center">
          <FaExclamationTriangle className="mx-auto w-10 h-10 text-[#DC2626] mb-3" />
          <p className="text-[#DC2626] font-medium">Unable to load invitations</p>
          <p className="text-sm text-[#94A3B8] mt-1">
            Make sure the backend is running and you have the right permissions.
          </p>
        </Card>
      </div>
    );
  }

  /* ───── Compute stats ───── */

  const now = new Date();
  const expiringSoon =
    invitations?.filter((inv) => {
      const expiresAt = new Date(inv.expires_at);
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 48;
    }).length ?? 0;

  const expiredCount =
    invitations?.filter((inv) => new Date(inv.expires_at) <= now).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header with Invite button */}
      <Header
        orgName={orgName}
        pendingCount={invitations?.length ?? 0}
        onInvite={() => setShowInviteModal(true)}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] dark:bg-[#1E40AF]/30 flex items-center justify-center">
            <FaPaperPlane className="w-6 h-6 text-[#1E40AF]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
              {invitations?.length ?? 0}
            </p>
            <p className="text-sm text-[#94A3B8]">Pending invitations</p>
          </div>
        </Card>

        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] dark:bg-[#92400E]/30 flex items-center justify-center">
            <FaClock className="w-6 h-6 text-[#92400E]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{expiringSoon}</p>
            <p className="text-sm text-[#94A3B8]">Expiring within 7 days</p>
          </div>
        </Card>

        <Card variant="elevated" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] dark:bg-[#991B1B]/30 flex items-center justify-center">
            <FaBan className="w-6 h-6 text-[#991B1B]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{expiredCount}</p>
            <p className="text-sm text-[#94A3B8]">Expired</p>
          </div>
        </Card>
      </div>

      {/* Empty state */}
      {(!invitations || invitations.length === 0) && (
        <Card variant="bordered" className="p-12 text-center">
          <FaEnvelope className="mx-auto w-12 h-12 text-[#94A3B8] mb-4" />
          <h3 className="text-lg font-semibold text-[#0A2E4A] dark:text-white mb-1">
            No pending invitations
          </h3>
          <p className="text-sm text-[#94A3B8] max-w-sm mx-auto mb-4">
            Invite team members to collaborate on shipments and track cargo together.
          </p>
          <Button onClick={() => setShowInviteModal(true)}>
            <FaUserPlus className="w-4 h-4" />
            Invite someone
          </Button>
        </Card>
      )}

      {/* Invitations Table */}
      {invitations && invitations.length > 0 && (
        <Card variant="bordered" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-[#334155]">
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Sent</Th>
                  <Th>Expires</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => {
                  const expiresAt = new Date(inv.expires_at);
                  const isExpired = expiresAt <= now;
                  const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
                  const isExpiringSoon = !isExpired && diffHours <= 48;

                  return (
                    <tr
                      key={inv.invitation_id}
                      className={`
                        border-b border-[#E2E8F0] dark:border-[#334155] last:border-b-0
                        transition-colors
                        ${isExpired ? 'opacity-50' : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A3D5A]/50'}
                      `}
                    >
                      <Td>
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="w-4 h-4 text-[#94A3B8]" />
                          <span className="text-sm font-medium text-[#0A2E4A] dark:text-white">
                            {inv.invited_email}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <Badge
                          variant={roleBadgeVariant[inv.invited_role] || 'default'}
                          size="sm"
                        >
                          {inv.invited_role}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                          {formatDate(inv.created_at)}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5">
                          {isExpired ? (
                            <span className="text-sm text-[#DC2626] flex items-center gap-1">
                              <FaExclamationTriangle className="w-3 h-3" />
                              Expired
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="text-sm text-[#92400E] flex items-center gap-1">
                              <FaClock className="w-3 h-3" />
                              {formatDate(inv.expires_at)}
                            </span>
                          ) : (
                            <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                              {formatDate(inv.expires_at)}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={resendMutation.isPending}
                            onClick={() => resendMutation.mutate(inv.invitation_id)}
                          >
                            <FaRedo className="w-3.5 h-3.5" />
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={cancelMutation.isPending}
                            onClick={() => cancelMutation.mutate(inv.invitation_id)}
                          >
                            <FaBan className="w-3.5 h-3.5" />
                            Cancel
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        orgId={orgId}
      />
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────────────────── */

function Header({
  orgName,
  pendingCount,
  onInvite,
}: {
  orgName?: string;
  pendingCount: number;
  onInvite: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Invitations</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {orgName || 'Organization'} &mdash; {pendingCount} invitation{pendingCount !== 1 ? 's' : ''} pending
        </p>
      </div>
      <Button onClick={onInvite}>
        <FaUserPlus className="w-4 h-4" />
        Invite Member
      </Button>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider ${className || ''}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className || ''}`}>
      {children}
    </td>
  );
}
