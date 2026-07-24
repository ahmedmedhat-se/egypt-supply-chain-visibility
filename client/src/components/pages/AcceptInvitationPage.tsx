import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';
import { showToast } from '../ui/Toast';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { extractErrorMessage } from '../../api/client';
import { ROUTES } from '../../constants/routes';
import {
  FaEnvelope,
  FaExclamationTriangle,
  FaCheckCircle,
  FaBuilding,
} from 'react-icons/fa';

const roleBadgeVariant: Record<string, 'info' | 'warning' | 'danger' | 'primary'> = {
  admin: 'primary',
  shipper: 'info',
  carrier: 'warning',
  regulator: 'default',
};

export const AcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  /* ───── Fetch invitation details ───── */

  const {
    data: invitation,
    isLoading: isFetchingInvite,
    error: inviteError,
  } = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      const res = await authApi.getInvitation(token!);
      return res.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: 0,
  });

  /* ───── Accept mutation ───── */

  const acceptMutation = useMutation({
    mutationFn: () =>
      authApi.acceptInvitation({
        token: token!,
        email: invitation!.email,
        password,
        firstName,
        lastName,
      }),
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.accessToken);
      showToast.success(
        `Welcome to ${res.data.user.organizationName || 'your organization'}!`,
      );
      navigate(ROUTES.DASHBOARD);
    },
    onError: (error: unknown) => {
      showToast.error(extractErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    acceptMutation.mutate();
  };

  /* ───── States ───── */

  // No token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F0F8] to-[#F8FAFC] dark:from-[#0A2E4A] dark:to-[#122A44] px-4">
        <Card variant="bordered" className="max-w-md w-full p-8 text-center">
          <FaExclamationTriangle className="mx-auto w-12 h-12 text-[#DC2626] mb-4" />
          <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-2">
            Invalid Invitation Link
          </h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            This invitation link is missing or invalid. Please check the link or ask
            your organization admin to send you a new one.
          </p>
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Fetching invitation details
  if (isFetchingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F0F8] to-[#F8FAFC] dark:from-[#0A2E4A] dark:to-[#122A44]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-[#94A3B8]">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  // Invitation invalid / expired
  if (inviteError || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F0F8] to-[#F8FAFC] dark:from-[#0A2E4A] dark:to-[#122A44] px-4">
        <Card variant="bordered" className="max-w-md w-full p-8 text-center">
          <FaExclamationTriangle className="mx-auto w-12 h-12 text-[#DC2626] mb-4" />
          <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-2">
            Invitation Expired or Invalid
          </h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            This invitation is no longer valid. Please ask your organization admin to
            send you a new one.
          </p>
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary">Go to Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Accepting — loading
  if (acceptMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F0F8] to-[#F8FAFC] dark:from-[#0A2E4A] dark:to-[#122A44]">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-[#94A3B8]">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Success
  if (acceptMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F0F8] to-[#F8FAFC] dark:from-[#0A2E4A] dark:to-[#122A44] px-4">
        <Card variant="bordered" className="max-w-md w-full p-8 text-center">
          <FaCheckCircle className="mx-auto w-12 h-12 text-[#065F46] mb-4" />
          <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white mb-2">
            Welcome aboard!
          </h2>
          <p className="text-sm text-[#94A3B8] mb-6">
            Your account has been created. You are being redirected to the dashboard...
          </p>
        </Card>
      </div>
    );
  }

  /* ───── Form ───── */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8F0F8] to-[#F8FAFC] dark:from-[#0A2E4A] dark:to-[#122A44] px-4 py-8">
      <Card variant="elevated" className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#0A2E4A] flex items-center justify-center mx-auto mb-4">
            <FaEnvelope className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
            Accept Invitation
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            You've been invited to join
          </p>
          <p className="text-base font-semibold text-[#0A2E4A] dark:text-white flex items-center justify-center gap-1.5 mt-1">
            <FaBuilding className="w-4 h-4 text-[#2D9B6E]" />
            {invitation.organizationName}
          </p>
          <div className="mt-2">
            <Badge
              variant={roleBadgeVariant[invitation.role] || 'default'}
              size="md"
            >
              As {invitation.role.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="Ahmed"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last name"
              placeholder="Tarek"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email address"
            type="email"
            value={invitation.email}
            readOnly
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError('');
            }}
            error={passwordError}
            required
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={acceptMutation.isPending}
            disabled={
              !firstName || !lastName || !password || !confirmPassword
            }
          >
            Accept Invitation & Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-[#94A3B8] mt-4">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-[#0A2E4A] font-medium hover:underline"
          >
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
};
