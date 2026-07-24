export const ROUTES = {
  // Public Routes
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  ACCEPT_INVITATION: '/accept-invitation',
  
  // Protected Routes (Authenticated)
  DASHBOARD: '/dashboard',
  DASHBOARD_ADMIN: '/admin/dashboard',
  DASHBOARD_SUPER_ADMIN: '/super-admin/dashboard',
  DASHBOARD_SHIPPER: '/shipper/dashboard',
  DASHBOARD_CARRIER: '/carrier/dashboard',
  DASHBOARD_REGULATOR: '/regulator/dashboard',
  SHIPMENTS: '/shipments',
  SHIPMENT_DETAIL: '/shipments/:id',
  SHIPMENT_CREATE: '/shipments/create',
  SHIPMENT_EDIT: '/shipments/:id/edit',
  TRACKING: '/tracking',
  TRACKING_SHIPMENT: '/tracking/:id',
  ALERTS: '/alerts',
  ALERT_DETAIL: '/alerts/:id',
  REPORTS: '/reports',
  REPORTS_CREATE: '/reports/create',
  REPORTS_DETAIL: '/reports/:id',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  HELP: '/help',
  FAQ: '/faq',
  TERMS: '/terms',
  PRIVACY: '/privacy',

  // Org Admin Routes
  USERS_REPORT: '/users-report',
  INVITATIONS: '/invitations',

  // Super Admin Routes
  SUPER_ADMIN_USERS_REPORT: '/super-admin/users-report',
  SUPER_ADMIN_INVITATIONS: '/super-admin/invitations',
  SUPER_ADMIN_ORGANIZATIONS: '/super-admin/organizations',

  // Admin Panel
  ADMIN: '/admin',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];
