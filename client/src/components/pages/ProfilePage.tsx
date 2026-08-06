import { useState } from 'react';
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
} from 'react-icons/fa';

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useSessions({ page, limit });
  const { mutate: revokeSession, isPending: isRevoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: isRevokingAll } = useRevokeAllSessions();

  if (!user) return null;

  const sessions = data?.data ?? [];
  const meta = data?.meta;
  const hasOtherSessions = sessions.some((s) => !s.isCurrent) || (meta?.totalItems ?? 0) > 1;

  const handleRevokeAll = () => {
    if (
      window.confirm(
        'Sign out on all other devices? You will stay signed in on this device.',
      )
    ) {
      revokeAll();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Profile</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Your account details</p>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-4 mb-6">
          <Avatar size="xl" fallback={user.name.split(' ').map(n => n[0]).join('')} />
          <div>
            <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white">{user.name}</h2>
            <p className="text-sm text-[#94A3B8]">{user.email}</p>
            <Badge variant="primary" size="sm" className="mt-1">{user.role}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0] dark:border-[#2A2A2A]">
          <div>
            <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Organization</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">{user.organizationName}</p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Role</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white capitalize">{user.role.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Email</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white">{user.email}</p>
          </div>
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
                Devices currently signed in to your account
              </p>
            </div>
          </div>
          <button
            onClick={handleRevokeAll}
            disabled={!hasOtherSessions || isRevokingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#DC2626] border-2 border-[#FECACA] hover:bg-[#FEF2F2] dark:border-[#7F1D1D]/40 dark:hover:bg-[#7F1D1D]/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRevokingAll ? (
              <LoadingSpinner size="sm" />
            ) : (
              <FaSignOutAlt className="w-3.5 h-3.5" />
            )}
            Sign out other devices
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
              <div key={session.sessionId} className="flex items-center gap-4 py-3">
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#DC2626] border-2 border-[#FECACA] hover:bg-[#FEF2F2] dark:border-[#7F1D1D]/40 dark:hover:bg-[#7F1D1D]/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaTimes className="w-3 h-3" />
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
  );
};