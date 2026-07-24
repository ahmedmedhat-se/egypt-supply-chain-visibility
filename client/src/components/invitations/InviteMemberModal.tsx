import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';
import { organizationApi } from '../../api/organization.api';
import { extractErrorMessage } from '../../api/client';
import { INVITE_ROLES } from '../../types/invitation.types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

export const InviteMemberModal = ({ isOpen, onClose, orgId }: InviteMemberModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('shipper');
  const queryClient = useQueryClient();

  const inviteMutation = useMutation({
    mutationFn: () =>
      organizationApi.invite(orgId, { email, role }),
    onSuccess: () => {
      showToast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('shipper');
      queryClient.invalidateQueries({ queryKey: ['org-invitations', orgId] });
      onClose();
    },
    onError: (error: unknown) => {
      showToast.error(extractErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          options={[...INVITE_ROLES]}
          placeholder="Select a role"
          required
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={inviteMutation.isPending}
            disabled={!email.trim()}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
