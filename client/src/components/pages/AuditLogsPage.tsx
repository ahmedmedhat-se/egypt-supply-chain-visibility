import { useState, useMemo, useEffect, Fragment, type ReactNode } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Pagination } from '../ui/Pagination';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { showToast } from '../ui/Toast';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useAuthStore } from '../../store/auth.store';
import { adminApi } from '../../api/admin.api';
import { organizationApi } from '../../api/organization.api';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import {
  AUDIT_CATEGORIES,
  ALL_AUDIT_ACTIONS,
  AUDIT_RESOURCE_TYPES,
  categoryForAction,
} from '../../constants/audit';
import {
  FaSearch,
  FaHistory,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaCodeBranch,
  FaUser,
  FaGlobe,
  FaTimes,
  FaDownload,
  FaUserCheck,
  FaKey,
  FaTruck,
  FaRoute,
  FaMapMarkerAlt,
  FaBuilding,
  FaUsers,
} from 'react-icons/fa';
import type { AuditLogEntry } from '../../types/admin.types';

interface AuditLogsPageProps {
  /** When provided the view is scoped to a single organization (org admin). */
  orgId?: string;
  /** Page title + subtitle — caller supplies role-appropriate copy. */
  title?: string;
  subtitle?: string;
}

const PAGE_SIZE = 25;
const EXPORT_BATCH = 100;

/** Icons per audit category — used on chips and in the table. */
const CATEGORY_ICONS: Record<string, ReactNode> = {
  auth: <FaKey className="w-3 h-3" />,
  shipment: <FaTruck className="w-3 h-3" />,
  route: <FaRoute className="w-3 h-3" />,
  checkpoint: <FaMapMarkerAlt className="w-3 h-3" />,
  organization: <FaBuilding className="w-3 h-3" />,
  user: <FaUsers className="w-3 h-3" />,
};

const DATE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
] as const;

const toDateTimeLocal = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const applyPreset = (key: string, setFrom: (v: string) => void, setTo: (v: string) => void) => {
  const now = new Date();
  if (key === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    setFrom(toDateTimeLocal(start));
    setTo(toDateTimeLocal(now));
  } else if (key === '7d' || key === '30d' || key === '90d') {
    const days = key === '7d' ? 7 : key === '30d' ? 30 : 90;
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    setFrom(toDateTimeLocal(start));
    setTo(toDateTimeLocal(now));
  } else {
    setFrom('');
    setTo('');
  }
};

const csvCell = (value: unknown): string => {
  const s = value === null || value === undefined ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
};

const prettyJson = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const AuditLogsPage = ({
  orgId,
  title = 'Audit Logs',
  subtitle = 'Track who did what, when, and from where — with full before/after details.',
}: AuditLogsPageProps) => {
  // ── Filters state ────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [myActionsOnly, setMyActionsOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { user: currentUser } = useAuthStore();

  // Debounce free-text search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const hasActiveFilters =
    debouncedSearch ||
    action ||
    resourceType ||
    category ||
    from ||
    to ||
    ipAddress ||
    myActionsOnly;

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      action: action || undefined,
      category: category || undefined,
      resourceType: resourceType || undefined,
      from: from || undefined,
      to: to || undefined,
      ipAddress: ipAddress || undefined,
      userId: myActionsOnly ? currentUser?.id : undefined,
    }),
    [page, debouncedSearch, action, category, resourceType, from, to, ipAddress, myActionsOnly, currentUser],
  );

  const { data, isLoading, isError } = useAuditLogs({
    orgId,
    filters,
  });

  const logs: AuditLogEntry[] = data?.data ?? [];
  const meta = data?.meta;

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setAction('');
    setResourceType('');
    setCategory('');
    setFrom('');
    setTo('');
    setIpAddress('');
    setMyActionsOnly(false);
    setPage(1);
  };

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  // ── CSV export: fetch every page matching the current filters, then download ──
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const base = {
        search: debouncedSearch || undefined,
        action: action || undefined,
        category: category || undefined,
        resourceType: resourceType || undefined,
        from: from || undefined,
        to: to || undefined,
        ipAddress: ipAddress || undefined,
        userId: myActionsOnly ? currentUser?.id : undefined,
      };

      const collected: AuditLogEntry[] = [];
      let exportPage = 1;
      let totalPages = 1;
      do {
        const response = orgId
          ? await organizationApi.getAuditLogs(orgId, {
              ...base,
              page: exportPage,
              limit: EXPORT_BATCH,
            })
          : await adminApi.getAuditLogs({
              ...base,
              page: exportPage,
              limit: EXPORT_BATCH,
            });
        const payload = response.data;
        collected.push(...(payload.data ?? []));
        totalPages = payload.meta?.totalPages ?? 1;
        exportPage += 1;
      } while (exportPage <= totalPages);

      if (collected.length === 0) {
        showToast.info('No audit logs match the current filters.');
        return;
      }

      const headers = [
        'Action',
        'Category',
        'Resource Type',
        'Resource ID',
        'Actor',
        'Email',
        'Organization',
        'IP Address',
        'Performed At',
        'Before',
        'After',
        'User Agent',
      ];
      const rows = collected.map((log) =>
        [
          log.audit_action,
          categoryForAction(log.audit_action)?.label ?? '',
          log.audit_resource_type,
          log.audit_resource_id,
          log.user ? `${log.user.user_first_name} ${log.user.user_last_name}` : 'System / Anonymous',
          log.user?.user_email ?? '',
          log.organization?.organization_name ?? '',
          log.audit_ip_address ?? '',
          log.audit_performed_at,
          prettyJson(log.audit_old_value),
          prettyJson(log.audit_new_value),
          log.audit_user_agent ?? '',
        ]
          .map(csvCell)
          .join(','),
      );
      const csv = `\uFEFF${[headers.map(csvCell).join(','), ...rows].join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast.success(`Exported ${collected.length} audit log entr${collected.length === 1 ? 'y' : 'ies'}.`);
    } catch {
      showToast.error('Failed to export audit logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{title}</h1>
          <p className="mt-1 text-[#94A3B8] dark:text-[#94A3B8]">{subtitle}</p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          {isExporting ? (
            <LoadingSpinner size="sm" />
          ) : (
            <FaDownload className="w-3.5 h-3.5 text-[#2D9B6E]" />
          )}
          {isExporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      {/* Filter Card */}
      <Card variant="bordered" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FaFilter className="w-4 h-4 text-[#2D9B6E]" />
            Filters
          </h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-[#94A3B8] hover:text-[#DC2626]"
            >
              <FaTimes className="w-3 h-3 mr-1.5" />
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] z-10" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, resource, email, IP, or agent…"
              className="pl-11"
              aria-label="Search audit logs"
            />
          </div>

          <Select
            label="Action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setCategory('');
              setPage(1);
            }}
            options={[
              { value: '', label: 'All actions' },
              ...ALL_AUDIT_ACTIONS.map((a) => ({ value: a, label: a })),
            ]}
          />

          <Select
            label="Resource type"
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All resources' },
              ...AUDIT_RESOURCE_TYPES.map((r) => ({
                value: r,
                label: r.charAt(0).toUpperCase() + r.slice(1),
              })),
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] mb-1.5">
              From
            </label>
            <Input
              type="datetime-local"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] mb-1.5">
              To
            </label>
            <Input
              type="datetime-local"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] mb-1.5">
              IP address
            </label>
            <Input
              value={ipAddress}
              onChange={(e) => {
                setIpAddress(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. 41.68.12.34"
            />
          </div>
        </div>

        {/* Category tag chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
          <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
            Quick tags:
          </span>
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setAction('');
              setPage(1);
            }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5',
              !category
                ? 'bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white border-transparent'
                : 'bg-white dark:bg-[#1A3D5A] text-[#94A3B8] border-[#E2E8F0] dark:border-[#1A3D5A] hover:text-[#0A2E4A] dark:hover:text-white',
            )}
          >
            All
          </button>
          {AUDIT_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setCategory(cat.key);
                setAction('');
                setPage(1);
              }}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5',
                category === cat.key
                  ? 'bg-[#2D9B6E] text-white border-transparent'
                  : 'bg-white dark:bg-[#1A3D5A] text-[#94A3B8] border-[#E2E8F0] dark:border-[#1A3D5A] hover:text-[#0A2E4A] dark:hover:text-white',
              )}
            >
              {CATEGORY_ICONS[cat.key]}
              {cat.label}
            </button>
          ))}
        </div>

        {/* My actions + date presets */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-4 pt-4 border-t border-[#E2E8F0] dark:border-[#1A3D5A]">
          <button
            type="button"
            role="switch"
            aria-checked={myActionsOnly}
            onClick={() => {
              setMyActionsOnly((v) => !v);
              setPage(1);
            }}
            className="flex items-center gap-2.5 group"
          >
            <span
              className={cn(
                'relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
                myActionsOnly ? 'bg-[#2D9B6E]' : 'bg-[#CBD5E1] dark:bg-[#1A3D5A]',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
                  myActionsOnly && 'translate-x-4',
                )}
              />
            </span>
            <span className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
              <FaUserCheck className="w-3.5 h-3.5 text-[#94A3B8]" />
              My actions only
            </span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
              Date:
            </span>
            {DATE_PRESETS.map((preset) => {
              const isActive =
                (preset.key === 'all' && !from && !to) ||
                (preset.key !== 'all' && !!from);
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    applyPreset(preset.key, setFrom, setTo);
                    setPage(1);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200',
                    isActive
                      ? 'bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white border-transparent'
                      : 'bg-white dark:bg-[#1A3D5A] text-[#94A3B8] border-[#E2E8F0] dark:border-[#1A3D5A] hover:text-[#0A2E4A] dark:hover:text-white',
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <AuditTableSkeleton />
      ) : isError ? (
        <Card variant="bordered" className="p-12 text-center text-[#DC2626]">
          Failed to load audit logs. Please try again.
        </Card>
      ) : logs.length === 0 ? (
        <Card variant="bordered">
          <EmptyState
            icon={FaHistory}
            title="No audit logs found"
            description={
              hasActiveFilters
                ? 'No entries match your filters. Try widening the search or clearing some filters.'
                : 'Nothing has been logged yet. Actions across the platform will appear here.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          {/* Table */}
          <Card variant="bordered" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC] dark:bg-[#0B2238]">
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3 hidden lg:table-cell">IP</th>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1A3D5A]">
                  {logs.map((log) => {
                    const cat = categoryForAction(log.audit_action);
                    const expanded = expandedId === log.audit_log_id;
                    const hasDiff =
                      log.audit_old_value != null || log.audit_new_value != null;
                    return (
                      <Fragment key={log.audit_log_id}>
                        <tr
                          onClick={() => hasDiff && toggleExpand(log.audit_log_id)}
                          className={cn(
                            'hover:bg-[#F8FAFC] dark:hover:bg-[#0B2238] transition-colors',
                            hasDiff && 'cursor-pointer',
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={cat?.badge ?? 'default'}
                                size="sm"
                                className="font-mono w-fit gap-1.5"
                              >
                                {cat && CATEGORY_ICONS[cat.key]}
                                {log.audit_action}
                              </Badge>
                              {Boolean(
                                log.audit_metadata &&
                                  typeof log.audit_metadata === 'object' &&
                                  (log.audit_metadata as Record<string, unknown>)
                                    .admin_action,
                              ) && (
                                <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide">
                                  Admin action
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-[#1A2A3A] dark:text-white capitalize">
                              {log.audit_resource_type}
                            </div>
                            {log.audit_resource_id && (
                              <div className="text-xs text-[#94A3B8] font-mono truncate max-w-[140px]">
                                {log.audit_resource_id}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[#E8F0F8] dark:bg-[#1A3D5A] flex items-center justify-center flex-shrink-0">
                                  <FaUser className="w-2.5 h-2.5 text-[#94A3B8]" />
                                </span>
                                <div className="min-w-0">
                                  <div className="text-[#1A2A3A] dark:text-white truncate max-w-[160px]">
                                    {log.user.user_first_name} {log.user.user_last_name}
                                  </div>
                                  <div className="text-xs text-[#94A3B8] truncate max-w-[160px]">
                                    {log.user.user_email}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">System / Anonymous</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {log.organization ? (
                              <div className="flex items-center gap-1.5 text-[#1A2A3A] dark:text-white">
                                <FaGlobe className="w-3 h-3 text-[#94A3B8]" />
                                <span className="truncate max-w-[140px]">
                                  {log.organization.organization_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs font-mono text-[#94A3B8]">
                              {log.audit_ip_address ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[#94A3B8] whitespace-nowrap">
                            {formatDate(log.audit_performed_at)}
                          </td>
                          <td className="px-4 py-3">
                            {hasDiff && (
                              <span className="text-[#94A3B8]">
                                {expanded ? (
                                  <FaChevronUp className="w-3 h-3" />
                                ) : (
                                  <FaChevronDown className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </td>
                        </tr>
                        {expanded && hasDiff && (
                          <tr className="bg-[#F8FAFC] dark:bg-[#0B2238]">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DiffBlock
                                  label="Before"
                                  value={log.audit_old_value}
                                  emptyText="No previous value"
                                />
                                <DiffBlock
                                  label="After"
                                  value={log.audit_new_value}
                                  emptyText="No new value"
                                />
                              </div>
                              {log.audit_user_agent && (
                                <p className="mt-3 text-xs text-[#94A3B8] break-all">
                                  <span className="font-medium uppercase tracking-wide">
                                    User agent:{' '}
                                  </span>
                                  {log.audit_user_agent}
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta && meta.totalItems > 0 && (
              <div className="border-t border-[#E2E8F0] dark:border-[#1A3D5A] px-4 py-3">
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  totalItems={meta.totalItems}
                  limit={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

/** Pulsing table skeleton shown while audit logs load. */
function AuditTableSkeleton() {
  return (
    <Card variant="bordered" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC] dark:bg-[#0B2238]">
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3 hidden lg:table-cell">IP</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1A3D5A]">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="h-5 w-40 rounded-full bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 rounded bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                  <div className="mt-1.5 h-3 w-32 rounded bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 rounded bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                      <div className="h-3 w-36 rounded bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-32 rounded bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="h-3 w-20 rounded bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-3 w-24 rounded bg-[#E8F0F8] dark:bg-[#1A3D5A] animate-pulse" />
                </td>
                <td className="px-4 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DiffBlock({
  label,
  value,
  emptyText,
}: {
  label: string;
  value: unknown;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1A3D5A] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1A3D5A] border-b border-[#E2E8F0] dark:border-[#1A3D5A]">
        <FaCodeBranch className="w-3 h-3 text-[#94A3B8]" />
        <span className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider">
          {label}
        </span>
      </div>
      <pre className="px-3 py-2 text-xs text-[#1A2A3A] dark:text-[#E2E8F0] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
        {value != null ? prettyJson(value) : emptyText}
      </pre>
    </div>
  );
}
