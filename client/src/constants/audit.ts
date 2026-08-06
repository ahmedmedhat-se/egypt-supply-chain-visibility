/** Audit action categories — used for the "tag" chips and colored badges. */
export interface AuditCategory {
  key: string;
  label: string;
  /** Prefix or exact actions that belong to this category. */
  prefixes: string[];
  badge: "default" | "success" | "warning" | "danger" | "info" | "primary";
}

export const AUDIT_CATEGORIES: AuditCategory[] = [
  {
    key: "auth",
    label: "Auth & Sessions",
    prefixes: ["AUTH_"],
    badge: "primary",
  },
  {
    key: "shipment",
    label: "Shipments",
    prefixes: ["SHIPMENT_"],
    badge: "info",
  },
  {
    key: "route",
    label: "Routes",
    prefixes: ["ROUTE_"],
    badge: "warning",
  },
  {
    key: "checkpoint",
    label: "Checkpoints",
    prefixes: ["CHECKPOINT_"],
    badge: "success",
  },
  {
    key: "organization",
    label: "Organizations",
    prefixes: [
      "ORG_",
      "UPDATE_ORGANIZATION",
      "DEACTIVATE_ORGANIZATION",
      "ACTIVATE_ORGANIZATION",
    ],
    badge: "default",
  },
  {
    key: "user",
    label: "Users",
    prefixes: [
      "UPDATE_USER",
      "DEACTIVATE_USER",
      "ACTIVATE_USER",
      "DELETE_USER",
    ],
    badge: "danger",
  },
];

export const categoryForAction = (action: string): AuditCategory | undefined =>
  AUDIT_CATEGORIES.find((c) => c.prefixes.some((p) => action.startsWith(p)));

export const ALL_AUDIT_ACTIONS = [
  // Auth & sessions
  "AUTH_REGISTER",
  "AUTH_LOGIN",
  "AUTH_LOGIN_FAILED",
  "AUTH_LOGOUT",
  "AUTH_ACCEPT_INVITATION",
  "AUTH_SESSION_REVOKE",
  "AUTH_SESSIONS_REVOKE_ALL",
  // Checkpoints
  "CHECKPOINT_CREATE",
  "CHECKPOINT_UPDATE",
  "CHECKPOINT_DEACTIVATE",
  "CHECKPOINT_ACTIVATE",
  "CHECKPOINT_REMOVE",
  // Organizations
  "ORG_INVITATION_CREATE",
  "ORG_INVITATION_RESEND",
  "ORG_INVITATION_CANCEL",
  "ORG_MEMBER_DEACTIVATE",
  "ORG_MEMBER_ACTIVATE",
  // Routes
  "ROUTE_CREATE",
  "ROUTE_UPDATE",
  "ROUTE_DEACTIVATE",
  "ROUTE_ACTIVATE",
  "ROUTE_REMOVE",
  "ROUTE_CHECKPOINT_ADD",
  "ROUTE_CHECKPOINT_REMOVE",
  // Shipments
  "SHIPMENT_CREATE",
  "SHIPMENT_UPDATE",
  "SHIPMENT_DELETE",
  "SHIPMENT_STATUS_UPDATE",
  "SHIPMENT_ACCEPT",
  "SHIPMENT_ROUTE_ASSIGN",
  // Admin
  "UPDATE_USER",
  "DEACTIVATE_USER",
  "ACTIVATE_USER",
  "DELETE_USER",
  "UPDATE_ORGANIZATION",
  "DEACTIVATE_ORGANIZATION",
  "ACTIVATE_ORGANIZATION",
  "UPDATE_SHIPMENT_STATUS",
] as const;

export const AUDIT_RESOURCE_TYPES = [
  "user",
  "organization",
  "shipment",
  "route",
  "checkpoint",
  "session",
  "invitation",
] as const;
