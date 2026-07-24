import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '../../store/auth.store';

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Profile</h1>
        <p className="text-[#94A3B8] dark:text-[#94A3B8] mt-1">Your account details</p>
      </div>

      <Card variant="elevated">
        <div className="flex items-center gap-4 mb-6">
          <Avatar size="xl" fallback={user.name.split(' ').map(n => n[0]).join('')} />
          <div>
            <h2 className="text-xl font-bold text-[#0A2E4A] dark:text-white">{user.name}</h2>
            <p className="text-sm text-[#94A3B8]">{user.email}</p>
            <Badge variant="primary" size="sm" className="mt-1">{user.role}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
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
          <div>
            <p className="text-xs text-[#94A3B8] uppercase tracking-wider">Organization ID</p>
            <p className="text-sm font-medium text-[#1A2A3A] dark:text-white font-mono">{user.organizationId.slice(0, 12)}...</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
