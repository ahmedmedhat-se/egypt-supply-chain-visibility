export const ROUTES = {
  // Public Routes
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  
  // Protected Routes (Authenticated)
  DASHBOARD: '/dashboard',
  SHIPMENTS: '/shipments',
  SHIPMENT_DETAIL: '/shipments/:id',
  SHIPMENT_CREATE: '/shipments/create',
  SHIPMENT_EDIT: '/shipments/:id/edit',
  TRACKING: '/tracking',
  TRACKING_SHIPMENT: '/tracking/:id',
  ALERTS: '/alerts',
  ALERT_DETAIL: '/alerts/:id',
  ORGANIZATIONS: '/organizations',
  ORGANIZATION_DETAIL: '/organizations/:id',
  ORGANIZATION_CREATE: '/organizations/create',
  REPORTS: '/reports',
  REPORTS_CREATE: '/reports/create',
  REPORTS_DETAIL: '/reports/:id',
  
  // Admin Routes
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: '/admin/users/:id',
  ADMIN_ORGANIZATIONS: '/admin/organizations',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_LOGS: '/admin/logs',
  
  // User Routes
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  HELP: '/help',
  FAQ: '/faq',
  TERMS: '/terms',
  PRIVACY: '/privacy',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];