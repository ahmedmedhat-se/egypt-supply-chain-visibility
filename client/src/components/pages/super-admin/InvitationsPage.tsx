import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Pagination } from '../../ui/Pagination';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { showToast } from '../../ui/Toast';
import { extractErrorMessage } from '../../../api/client';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../ui/Table';
import { adminApi } from '../../../api/admin.api';
import { organizationApi } from '../../../api/organization.api';
import { formatDate } from '../../../lib/utils';
import {
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPaperPlane,
  FaTrash,
} from 'react-icons/fa';

export const SuperAdminInvitationsPage = () => {
  const queryClient = useQueryClient();
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

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => {
      const invitation = data?.data.find((inv) => inv.invitation_id === invitationId);
      if (!invitation) throw new Error('Invitation not found');
      return organizationApi.resendInvitation(invitation.organization_id, invitationId);
    },
    onSuccess: () => {
      showToast.success('Invitation resent successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
    onError: (err: unknown) => {
      showToast.error(extractErrorMessage(err));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ orgId, invitationId }: { orgId: string; invitationId: string }) =>
      organizationApi.cancelInvitation(orgId, invitationId),
    onSuccess: () => {
      showToast.success('Invitation cancelled');
      queryClient.invalidateQueries({ queryKey: ['admin-invitations'] });
    },
    onError: (err: unknown) => {
      showToast.error(extractErrorMessage(err));
    },
  });

  const invitations = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Platform Invitations</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">
          {meta ? `${meta.totalItems} total invitation${meta.totalItems !== 1 ? 's' : ''}` : ''}
        </p>
      </div>

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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-[#94A3B8] py-8">
                    No invitations found.
                  </TableCell>
                </TableRow>
              ) : (
                invitations.map((inv) => {
                  const expiresAt = new Date(inv.expires_at);
                  const now = new Date();
                  const isExpired = inv.status === 'expired' || expiresAt <= now;
                  return (
                    <TableRow key={inv.invitation_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="w-4 h-4 text-[#94A3B8]" />
                          {inv.invited_email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.invited_role === 'admin' ? 'primary' : 'info'} size="sm">
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
                      <TableCell className="text-right">
                        {inv.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => resendMutation.mutate(inv.invitation_id)}
                              className="p-1.5 rounded-lg text-[#2D9B6E] hover:bg-[#D1FAE5] transition-colors"
                              title="Resend"
                              disabled={resendMutation.isPending}
                            >
                              <FaPaperPlane className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Cancel this invitation?')) {
                                  cancelMutation.mutate({
                                    orgId: inv.organization_id,
                                    invitationId: inv.invitation_id,
                                  });
                                }
                              }}
                              className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                              title="Cancel"
                              disabled={cancelMutation.isPending}
                            >
                              <FaTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
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
};
