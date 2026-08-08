import { useState, useMemo, useEffect, Fragment, type ReactNode } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Pagination } from '../ui/Pagination';
import { LoadingSpinner } from '../ui/LoadingSpinner';
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
  FaClock,
  FaShieldAlt,
} from 'react-icons/fa';
import type { AuditLogEntry } from '../../types/admin.types';

interface AuditLogsPageProps {
  orgId?: string;
  title?: string;
  subtitle?: string;
}

const PAGE_SIZE = 25;
const EXPORT_BATCH = 100;

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
  const [activePreset, setActivePreset] = useState<string>('all');

  const { user: currentUser } = useAuthStore();

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
    setActivePreset('all');
    setPage(1);
  };

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

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
      const EXPORT_ROW_CAP = 10_000;
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
      } while (exportPage <= totalPages && collected.length < EXPORT_ROW_CAP);

      if (collected.length >= EXPORT_ROW_CAP) {
        showToast.warning(
          `Export capped at ${EXPORT_ROW_CAP.toLocaleString()} rows — narrow the filters for a complete file.`,
        );
      }

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
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-8 bg-[#2D9B6E] rounded-full" />
            <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{title}</h1>
          </div>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm pl-4">{subtitle}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111111] border-2 border-[#E2E8F0] dark:border-[#2A2A2A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] rounded-xl font-medium text-[#0A2E4A] dark:text-white transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Exporting…</span>
            </>
          ) : (
            <>
              <FaDownload className="w-4 h-4 text-[#2D9B6E]" />
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#D1FAE5] dark:bg-[#1F7A52]/30 flex items-center justify-center">
              <FaFilter className="w-4 h-4 text-[#2D9B6E]" />
            </div>
            Filters
          </h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#94A3B8] hover:text-[#DC2626] transition-colors duration-200 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/20"
            >
              <FaTimes className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] z-10" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, resource, email, IP, or agent…"
              className="pl-11 dark:bg-[#0A0A0A] dark:border-[#2A2A2A]"
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
                setActivePreset('');
                setPage(1);
              }}
              className="dark:bg-[#0A0A0A] dark:border-[#2A2A2A]"
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
                setActivePreset('');
                setPage(1);
              }}
              className="dark:bg-[#0A0A0A] dark:border-[#2A2A2A]"
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
              className="dark:bg-[#0A0A0A] dark:border-[#2A2A2A]"
            />
          </div>
        </div>

        {/* Category tag chips */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-[#E2E8F0] dark:border-[#2A2A2A]">
          <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
            <FaShieldAlt className="w-3 h-3" />
            Categories:
          </span>
          <button
            type="button"
            onClick={() => {
              setCategory('');
              setAction('');
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-200 flex items-center gap-1.5',
              !category
                ? 'bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-[#111111] text-[#94A3B8] border-[#E2E8F0] dark:border-[#2A2A2A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] hover:text-[#0A2E4A] dark:hover:text-white'
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
                'px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-200 flex items-center gap-1.5',
                category === cat.key
                  ? 'bg-[#2D9B6E] text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-[#111111] text-[#94A3B8] border-[#E2E8F0] dark:border-[#2A2A2A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] hover:text-[#0A2E4A] dark:hover:text-white'
              )}
            >
              {CATEGORY_ICONS[cat.key]}
              {cat.label}
            </button>
          ))}
        </div>

        {/* My actions + date presets */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-5 pt-5 border-t border-[#E2E8F0] dark:border-[#2A2A2A]">
          <button
            type="button"
            role="switch"
            aria-checked={myActionsOnly}
            onClick={() => {
              setMyActionsOnly((v) => !v);
              setPage(1);
            }}
            className="flex items-center gap-3 group"
          >
            <span
              className={cn(
                'relative w-10 h-6 rounded-full transition-all duration-300 flex-shrink-0 shadow-inner',
                myActionsOnly ? 'bg-[#2D9B6E]' : 'bg-[#CBD5E1] dark:bg-[#2A2A2A]'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300',
                  myActionsOnly && 'translate-x-4'
                )}
              />
            </span>
            <span className="text-sm font-medium text-[#1A2A3A] dark:text-[#E2E8F0] flex items-center gap-1.5">
              <FaUserCheck className="w-3.5 h-3.5 text-[#94A3B8]" />
              My actions only
            </span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <FaClock className="w-3 h-3" />
              Date:
            </span>
            {DATE_PRESETS.map((preset) => {
              const isActive = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    applyPreset(preset.key, setFrom, setTo);
                    setActivePreset(preset.key);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border-2 transition-all duration-200',
                    isActive
                      ? 'bg-[#0A2E4A] dark:bg-[#2D9B6E] text-white border-transparent shadow-sm'
                      : 'bg-white dark:bg-[#111111] text-[#94A3B8] border-[#E2E8F0] dark:border-[#2A2A2A] hover:border-[#2D9B6E] dark:hover:border-[#2D9B6E] hover:text-[#0A2E4A] dark:hover:text-white'
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <AuditTableSkeleton />
      ) : isError ? (
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#FEE2E2] dark:bg-[#991B1B]/30 flex items-center justify-center mx-auto mb-4">
            <FaTimes className="w-8 h-8 text-[#DC2626]" />
          </div>
          <p className="text-[#DC2626] font-medium">Failed to load audit logs</p>
          <p className="text-sm text-[#94A3B8] mt-1">Please try again later</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] p-12 text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#E8F0F8] dark:bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4">
            <FaHistory className="w-10 h-10 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A2E4A] dark:text-white mb-2">No audit logs found</h3>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm max-w-md mx-auto">
            {hasActiveFilters
              ? 'No entries match your filters. Try widening the search or clearing some filters.'
              : 'Nothing has been logged yet. Actions across the platform will appear here.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#2D9B6E] hover:bg-[#1F7A52] text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-[#2D9B6E]/20 hover:shadow-xl hover:shadow-[#2D9B6E]/30"
            >
              <FaTimes className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
              Showing <span className="font-medium text-[#0A2E4A] dark:text-white">{logs.length}</span> of{' '}
              <span className="font-medium text-[#0A2E4A] dark:text-white">{meta?.totalItems}</span> entries
            </p>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC] dark:bg-[#0A0A0A] border-b border-[#E2E8F0] dark:border-[#2A2A2A]">
                    <th className="px-4 py-3.5">Action</th>
                    <th className="px-4 py-3.5">Resource</th>
                    <th className="px-4 py-3.5">Actor</th>
                    <th className="px-4 py-3.5 hidden lg:table-cell">Organization</th>
                    <th className="px-4 py-3.5 hidden xl:table-cell">IP</th>
                    <th className="px-4 py-3.5">When</th>
                    <th className="px-4 py-3.5 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
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
                            'transition-colors duration-150',
                            hasDiff && 'cursor-pointer',
                            expanded
                              ? 'bg-[#F8FAFC] dark:bg-[#1A1A1A]'
                              : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A]'
                          )}
                        >
                          <td className="px-4 py-3.5">
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
                          <td className="px-4 py-3.5">
                            <div className="text-[#1A2A3A] dark:text-white capitalize font-medium">
                              {log.audit_resource_type}
                            </div>
                            {log.audit_resource_id && (
                              <div className="text-xs text-[#94A3B8] font-mono truncate max-w-[140px] mt-0.5">
                                {log.audit_resource_id}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#E8F0F8] dark:bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                                  <FaUser className="w-3.5 h-3.5 text-[#94A3B8]" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[#1A2A3A] dark:text-white truncate max-w-[160px] font-medium">
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
                          <td className="px-4 py-3.5 hidden lg:table-cell">
                            {log.organization ? (
                              <div className="flex items-center gap-1.5 text-[#1A2A3A] dark:text-white">
                                <FaGlobe className="w-3 h-3 text-[#94A3B8]" />
                                <span className="truncate max-w-[140px] font-medium">
                                  {log.organization.organization_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#94A3B8]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 hidden xl:table-cell">
                            <span className="text-xs font-mono text-[#94A3B8] bg-[#E8F0F8] dark:bg-[#1A1A1A] px-2 py-0.5 rounded">
                              {log.audit_ip_address ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-[#94A3B8] whitespace-nowrap">
                            {formatDate(log.audit_performed_at)}
                          </td>
                          <td className="px-4 py-3.5">
                            {hasDiff && (
                              <span className={cn(
                                'flex items-center justify-center w-6 h-6 rounded-lg transition-colors duration-200',
                                expanded
                                  ? 'bg-[#2D9B6E]/10 text-[#2D9B6E]'
                                  : 'text-[#94A3B8] hover:bg-[#E8F0F8] dark:hover:bg-[#1A1A1A]'
                              )}>
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
                          <tr className="bg-[#F8FAFC] dark:bg-[#0A0A0A]">
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
                                <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-[#2A2A2A]">
                                  <FaShieldAlt className="w-3.5 h-3.5 text-[#94A3B8] mt-0.5 flex-shrink-0" />
                                  <p className="text-xs text-[#94A3B8] break-all">
                                    <span className="font-medium uppercase tracking-wide">User agent: </span>
                                    {log.audit_user_agent}
                                  </p>
                                </div>
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
              <div className="border-t border-[#E2E8F0] dark:border-[#2A2A2A] px-4 py-3 bg-[#F8FAFC] dark:bg-[#0A0A0A]">
                <Pagination
                  page={page}
                  totalPages={meta.totalPages}
                  totalItems={meta.totalItems}
                  limit={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

function AuditTableSkeleton() {
  return (
    <div className="bg-white dark:bg-[#111111] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold text-[#94A3B8] uppercase tracking-wider bg-[#F8FAFC] dark:bg-[#0A0A0A] border-b border-[#E2E8F0] dark:border-[#2A2A2A]">
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Resource</th>
              <th className="px-4 py-3.5">Actor</th>
              <th className="px-4 py-3.5 hidden lg:table-cell">Organization</th>
              <th className="px-4 py-3.5 hidden xl:table-cell">IP</th>
              <th className="px-4 py-3.5">When</th>
              <th className="px-4 py-3.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3.5">
                  <div className="h-5 w-40 rounded-full bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-4 w-24 rounded bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                  <div className="mt-1.5 h-3 w-32 rounded bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 rounded bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                      <div className="h-3 w-36 rounded bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <div className="h-4 w-32 rounded bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <div className="h-3 w-20 rounded bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="h-3 w-24 rounded bg-[#E8F0F8] dark:bg-[#1A1A1A] animate-pulse" />
                </td>
                <td className="px-4 py-3.5" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    <div className="rounded-xl border border-[#E2E8F0] dark:border-[#2A2A2A] overflow-hidden bg-white dark:bg-[#111111]">
      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0A0A0A] border-b border-[#E2E8F0] dark:border-[#2A2A2A]">
        <FaCodeBranch className="w-3.5 h-3.5 text-[#94A3B8]" />
        <span className="text-xs font-semibold text-[#0A2E4A] dark:text-white uppercase tracking-wider">
          {label}
        </span>
      </div>
      <pre className="px-3.5 py-3 text-xs text-[#1A2A3A] dark:text-[#E2E8F0] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap break-all bg-white dark:bg-[#111111]">
        {value != null ? prettyJson(value) : emptyText}
      </pre>
    </div>
  );
}