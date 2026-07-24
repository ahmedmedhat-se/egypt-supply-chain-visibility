import type { ReactNode } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface RoleRouteProps {
  children: ReactNode;
  roles: Array<'super_admin' | 'admin' | 'shipper' | 'carrier' | 'regulator'>;
}

/**
 * Wraps a route that requires a specific role (or roles).
 * Delegates auth validation to ProtectedRoute, then checks the role.
 *
 * Example: admin-only page
 * ```tsx
 * <RoleRoute roles={['super_admin', 'admin']}>
 *   <AdminPage />
 * </RoleRoute>
 * ```
 */
export const RoleRoute = ({ children, roles }: RoleRouteProps) => {
  return (
    <ProtectedRoute requiredRoles={roles}>
      {children}
    </ProtectedRoute>
  );
};
