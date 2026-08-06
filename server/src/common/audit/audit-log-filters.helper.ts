import { Prisma } from '@prisma/client';
import { QueryAuditLogsDto } from '../dto/query-audit-logs.dto';

/**
 * Builds the Prisma `where` for audit log queries. Shared by the super-admin and org-admin
 */
export function buildAuditLogWhere(
  query: QueryAuditLogsDto,
  organizationId?: string,
): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (organizationId) {
    where.organization_id = organizationId;
  }

  // Free-text search (an OR group) and category tags (an OR group) must be
  // AND-combined — otherwise one group would swallow the other. Both are
  // collected into separate groups below and joined via where.AND at the end.
  const orGroups: Prisma.AuditLogWhereInput[] = [];

  if (query.search) {
    const contains = {
      contains: query.search,
      mode: Prisma.QueryMode.insensitive,
    };
    orGroups.push({
      OR: [
        { audit_action: contains },
        { audit_resource_type: contains },
        { audit_ip_address: contains },
        { audit_user_agent: contains },
        {
          user: {
            OR: [
              { user_email: contains },
              { user_first_name: contains },
              { user_last_name: contains },
            ],
          },
        },
      ],
    });
  }

  if (query.action) where.audit_action = query.action;

  if (query.category) {
    const categoryPrefixes: Record<string, string[]> = {
      auth: ['AUTH_'],
      shipment: ['SHIPMENT_'],
      route: ['ROUTE_'],
      checkpoint: ['CHECKPOINT_'],
      organization: [
        'ORG_',
        'UPDATE_ORGANIZATION',
        'DEACTIVATE_ORGANIZATION',
        'ACTIVATE_ORGANIZATION',
      ],
      user: ['UPDATE_USER', 'DEACTIVATE_USER', 'ACTIVATE_USER', 'DELETE_USER'],
    };
    const prefixes = categoryPrefixes[query.category];
    if (prefixes) {
      const exact = prefixes.filter((p) => !p.endsWith('_'));
      const prefixMatches = prefixes
        .filter((p) => p.endsWith('_'))
        .map((p) => ({ audit_action: { startsWith: p } }));
      const or: Prisma.AuditLogWhereInput[] = [
        ...(exact.length > 0 ? [{ audit_action: { in: exact } }] : []),
        ...prefixMatches,
      ];
      if (or.length === 1) {
        // Single-prefix category → a plain action filter, ANDs with everything.
        where.audit_action = (
          or[0] as { audit_action: Prisma.StringFilter<'AuditLog'> }
        ).audit_action;
      } else {
        orGroups.push({ OR: or });
      }
    }
  }

  if (orGroups.length > 0) {
    where.AND = orGroups;
  }

  if (query.resourceType) where.audit_resource_type = query.resourceType;
  if (query.resourceId) where.audit_resource_id = query.resourceId;
  if (query.userId) where.user_id = query.userId;
  if (query.ipAddress) {
    where.audit_ip_address = { contains: query.ipAddress, mode: 'insensitive' };
  }

  if (query.from || query.to) {
    where.audit_performed_at = {};
    if (query.from) {
      where.audit_performed_at.gte = new Date(query.from);
    }
    if (query.to) {
      where.audit_performed_at.lte = new Date(query.to);
    }
  }

  return where;
}

/** Shared audit log row include — actor + affected organization. */
export const AUDIT_LOG_INCLUDE = {
  user: {
    select: {
      user_id: true,
      user_email: true,
      user_first_name: true,
      user_last_name: true,
    },
  },
  organization: {
    select: {
      organization_id: true,
      organization_name: true,
      organization_type: true,
    },
  },
} satisfies Prisma.AuditLogInclude;
