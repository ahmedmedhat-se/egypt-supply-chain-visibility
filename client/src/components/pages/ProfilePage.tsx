import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { authApi } from '../../api/auth.api';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { useAuthStore } from '../../store/auth.store';
import { useSessions, useRevokeSession, useRevokeAllSessions } from '../../hooks/useSessions';
import { formatDate } from '../../lib/utils';
import {
  FaLaptop,
  FaShieldAlt,
  FaSignOutAlt,
  FaTimes,
  FaExclamationTriangle,
  FaUserEdit,
  FaLock,
} from 'react-icons/fa';

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useSessions({ page, limit });
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: isRevokingAll } = useRevokeAllSessions();

  // Profile Form
  const { register: registerProfile, handleSubmit: handleProfileSubmit } = useForm({
    defaultValues: {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ').slice(1).join(' ') || '',
      phoneNumber: '',
    },
  });

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      toast.success('Profile updated successfully');
      useAuthStore.getState().setAuth(res.data, useAuthStore.getState().accessToken!);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  // Password Form
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  const { mutate: updatePassword, isPending: isUpdatingPassword } = useMutation({
    mutationFn: authApi.updatePassword,
    onSuccess: () => {
      toast.success('Password updated successfully');
      resetPasswordForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    },
  });

  if (!user) return null;

  const sessions = data?.data ?? [];
  const meta = data?.meta;
  const hasOtherSessions = sessions.some((s) => !s.isCurrent) || (meta?.totalItems ?? 0) > 1;

  const handleRevokeAll = () => {
    if (window.confirm('Sign out on all other devices? You will stay signed in on this device.')) {
      revokeAll();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Account Settings</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Manage your profile, security, and sessions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Profile card / Edit Form */}
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FaUserEdit className="w-5 h-5 text-[#3B82F6]" />
              <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white">Profile Information</h2>
            </div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#E2E8F0] dark:border-[#2A2A2A]">
              <Avatar size="xl" fallback={user.name.split(' ').map(n => n[0]).join('')} />
              <div>
                <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white">{user.name}</h2>
                <p className="text-sm text-[#94A3B8]">{user.email}</p>
                <Badge variant="primary" size="sm" className="mt-1">{user.role}</Badge>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit((data) => updateProfile(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1A2A3A] dark:text-white mb-1">First Name</label>
                  <input
                    {...registerProfile('firstName', { required: 'Required' })}
                    className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-transparent px-4 py-2 text-sm text-[#0A2E4A] dark:text-white outline-none focus:border-[#3B82F6] dark:focus:border-[#3B82F6] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2A3A] dark:text-white mb-1">Last Name</label>
                  <input
                    {...registerProfile('lastName', { required: 'Required' })}
                    className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-transparent px-4 py-2 text-sm text-[#0A2E4A] dark:text-white outline-none focus:border-[#3B82F6] dark:focus:border-[#3B82F6] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2A3A] dark:text-white mb-1">Phone Number (Optional)</label>
                <input
                  {...registerProfile('phoneNumber')}
                  className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-transparent px-4 py-2 text-sm text-[#0A2E4A] dark:text-white outline-none focus:border-[#3B82F6] dark:focus:border-[#3B82F6] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#0A2E4A] hover:bg-[#0A2E4A]/90 dark:bg-[#3B82F6] dark:hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] disabled:opacity-50 transition-colors"
              >
                {isUpdatingProfile ? <LoadingSpinner size="sm" /> : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Security / Password Form */}
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FaLock className="w-5 h-5 text-[#8B5CF6]" />
              <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white">Security</h2>
            </div>
            <form onSubmit={handlePasswordSubmit((data) => updatePassword(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1A2A3A] dark:text-white mb-1">Current Password</label>
                <input
                  type="password"
                  {...registerPassword('currentPassword', { required: 'Required' })}
                  className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-transparent px-4 py-2 text-sm text-[#0A2E4A] dark:text-white outline-none focus:border-[#3B82F6] dark:focus:border-[#3B82F6] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2A3A] dark:text-white mb-1">New Password</label>
                <input
                  type="password"
                  {...registerPassword('newPassword', { required: 'Required', minLength: 8 })}
                  className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-transparent px-4 py-2 text-sm text-[#0A2E4A] dark:text-white outline-none focus:border-[#3B82F6] dark:focus:border-[#3B82F6] transition-all"
                />
                <p className="text-xs text-[#94A3B8] mt-1">Must be at least 8 characters long</p>
              </div>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full flex items-center justify-center py-2 px-4 border border-[#E2E8F0] dark:border-[#2A2A2A] rounded-xl shadow-sm text-sm font-medium text-[#0A2E4A] dark:text-white bg-white hover:bg-gray-50 dark:bg-transparent dark:hover:bg-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] disabled:opacity-50 transition-colors"
              >
                {isUpdatingPassword ? <LoadingSpinner size="sm" /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center">
                <FaShieldAlt className="w-5 h-5 text-[#2D9B6E]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0A2E4A] dark:text-white">
                  Active Sessions
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Devices currently signed in
                </p>
              </div>
            </div>
            <button
              onClick={handleRevokeAll}
              disabled={!hasOtherSessions || isRevokingAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#DC2626] border-2 border-[#FECACA] hover:bg-[#FEF2F2] dark:border-[#7F1D1D]/40 dark:hover:bg-[#7F1D1D]/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRevokingAll ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FaSignOutAlt className="w-3.5 h-3.5" />
              )}
              Sign out all
            </button>
          </div>

          {isLoading ? (
            <div className="py-10 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center">
              <FaLaptop className="mx-auto w-8 h-8 text-[#94A3B8] mb-2" />
              <p className="text-sm text-[#94A3B8]">No active sessions found.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
              {sessions.map((session) => (
                <div key={session.sessionId} className="flex items-center gap-3 py-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      session.isCurrent
                        ? 'bg-[#D1FAE5] dark:bg-[#1F7A52]/30'
                        : 'bg-[#E8F0F8] dark:bg-[#1A1A1A]'
                    }`}
                  >
                    <FaLaptop
                      className={`w-5 h-5 ${
                        session.isCurrent ? 'text-[#2D9B6E]' : 'text-[#94A3B8]'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#0A2E4A] dark:text-white truncate">
                        Session {session.sessionId.slice(0, 8)}
                      </p>
                      {session.isCurrent && (
                        <Badge variant="success" size="sm">This device</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {session.createdAt
                        ? `Signed in ${formatDate(session.createdAt)}`
                        : 'Sign-in date unavailable'}
                    </p>
                  </div>

                  {!session.isCurrent && (
                    <button
                      onClick={() => {
                        if (window.confirm('Revoke this session? The device will be signed out.')) {
                          revokeSession(session.sessionId);
                        }
                      }}
                      disabled={isRevoking}
                      className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[#DC2626] border border-[#FECACA] hover:bg-[#FEF2F2] dark:border-[#7F1D1D]/40 dark:hover:bg-[#7F1D1D]/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTimes className="w-2.5 h-2.5" />
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {meta && !isLoading && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2A2A2A]">
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                totalItems={meta.totalItems}
                limit={limit}
                onPageChange={setPage}
              />
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2A2A2A] flex items-start gap-2">
            <FaExclamationTriangle className="w-4 h-4 text-[#92400E] dark:text-[#FBBF24] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#94A3B8]">
              Revoking a session signs that device out immediately. You can always sign
              back in with your credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};