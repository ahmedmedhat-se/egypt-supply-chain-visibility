import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Pagination } from '../ui/Pagination';
import { alertsApi } from '../../api/alerts.api';
import type { UserAlert } from '../../api/alerts.api';
import { cn } from '../../lib/utils';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { extractErrorMessage } from '../../api/client';
import {
  FaBell,
  FaCheck,
  FaSearch,
  FaTimes,
  FaInbox,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

type ReadFilter = 'all' | 'unread' | 'read';
type SeverityFilter = 'all' | 'info' | 'warning' | 'critical';

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: null },
  {
    value: 'info',
    label: 'Info',
    icon: <FaInfoCircle className="w-3.5 h-3.5 text-blue-500" />,
  },
  {
    value: 'warning',
    label: 'Warning',
    icon: <FaExclamationTriangle className="w-3.5 h-3.5 text-orange-500" />,
  },
  {
    value: 'critical',
    label: 'Critical',
    icon: <FaExclamationCircle className="w-3.5 h-3.5 text-red-500" />,
  },
];

const getSeverityIcon = (severity: string, className: string) => {
  switch (severity) {
    case 'critical':
      return <FaExclamationCircle className={`${className} text-red-500`} />;
    case 'warning':
      return <FaExclamationTriangle className={`${className} text-orange-500`} />;
    default:
      return <FaInfoCircle className={`${className} text-blue-500`} />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/30';
    case 'warning':
      return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/30';
    default:
      return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/30';
  }
};

export const AlertsPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const limit = 10;
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', { page, limit, readFilter, severityFilter, search }],
    queryFn: async () => {
      const res = await alertsApi.getAlerts({
        page,
        limit,
        isRead: readFilter === 'all' ? undefined : readFilter === 'unread' ? 'false' : 'true',
        severity: severityFilter === 'all' ? undefined : severityFilter,
        search: search || undefined,
      });
      return res.data;
    },
  });

  const { data: unreadData } = useQuery({
    queryKey: ['unread-alerts-count'],
    queryFn: async () => {
      const res = await alertsApi.getUnreadCount();
      return res.data;
    },
  });

  const invalidateAlerts = () => {
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
  };

  const markAsRead = useMutation({
    mutationFn: (id: string) => alertsApi.markAsRead(id),
    onSuccess: () => invalidateAlerts(),
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error) || 'Failed to mark alert as read');
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => alertsApi.markAllAsRead(),
    onSuccess: () => {
      invalidateAlerts();
      toast.success('All alerts marked as read');
    },
  });

  const alerts: UserAlert[] = data?.data ?? [];
  const meta = data?.meta;
  const unreadCount = unreadData?.count ?? 0;
  const hasActiveFilters =
    search !== '' || readFilter !== 'all' || severityFilter !== 'all';

  const setRead = (value: ReadFilter) => {
    setReadFilter(value);
    setPage(1);
  };

  const setSeverity = (value: SeverityFilter) => {
    setSeverityFilter(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setReadFilter('all');
    setSeverityFilter('all');
    setPage(1);
  };

  const toggleExpand = (id: string) => {
    setExpandedAlerts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#0A2E4A] dark:text-white">
            Alerts
          </h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm">
            Stay informed about your shipments and system updates
          </p>
        </div>
        {alerts.some((a: UserAlert) => !a.is_read) && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            isLoading={markAllAsRead.isPending}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-md"
          >
            <span className="absolute inset-0 bg-[#2D9B6E]/5 dark:bg-[#2D9B6E]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <FaCheck className="mr-2 group-hover:scale-110 transition-transform duration-200" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-white dark:bg-[#111111] p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10">
              <FaBell className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0A2E4A] dark:text-white tracking-tight">
                {unreadCount}
              </p>
              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] font-medium">
                Unread alerts
              </p>
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-white dark:bg-[#111111] p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/10 to-sky-600/5 dark:from-sky-500/20 dark:to-sky-600/10">
              <FaInbox className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0A2E4A] dark:text-white tracking-tight">
                {meta?.totalItems ?? 0}
              </p>
              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] font-medium">
                {hasActiveFilters ? 'Filtered results' : 'Total alerts'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card variant="bordered" className="overflow-hidden transition-all duration-300 hover:shadow-md">
        <div className="p-5 space-y-4">
          <div className="relative group">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] group-focus-within:text-[#2D9B6E] transition-colors duration-200" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, message, or shipment reference..."
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-[#D1D9E6] dark:border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#2D9B6E] focus:border-transparent text-sm bg-white dark:bg-[#111111] text-[#1A2A3A] dark:text-white placeholder:text-[#94A3B8] transition-all duration-200 hover:border-[#94A3B8] dark:hover:border-[#3A3A3A]"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                aria-label="Clear search"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-xl border border-[#E2E8F0] dark:border-[#2A2A2A] overflow-hidden shadow-sm">
              {(['all', 'unread', 'read'] as ReadFilter[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setRead(value)}
                  className={cn(
                    'px-5 py-2 text-sm font-medium capitalize transition-all duration-200 relative',
                    readFilter === value
                      ? 'bg-[#2D9B6E] text-white shadow-md'
                      : 'bg-white dark:bg-[#111111] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1A1A1A]'
                  )}
                >
                  {value}
                  {readFilter === value && (
                    <span className="absolute inset-0 bg-gradient-to-r from-[#2D9B6E]/0 via-white/10 to-[#2D9B6E]/0 animate-shimmer" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200',
                    severityFilter === option.value
                      ? 'bg-[#0A2E4A] text-white dark:bg-white dark:text-[#0A2E4A] shadow-md scale-105'
                      : 'bg-[#F1F5F9] dark:bg-[#1A1A1A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E8F0F8] dark:hover:bg-[#222] hover:scale-105'
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-[#DC2626] bg-red-50 dark:bg-red-950/30 hover:bg-[#FEE2E2] dark:hover:bg-red-950/50 transition-all duration-200 hover:scale-105"
                >
                  <FaTimes className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card variant="bordered" className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        {isLoading ? (
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#1A1A1A]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-5 sm:p-6 animate-pulse">
                <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-2/5 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                  <div className="h-4 w-3/4 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                  <div className="h-4 w-1/3 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          hasActiveFilters ? (
            <div className="py-20 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2D9B6E]/20 to-[#0A2E4A]/20 blur-2xl rounded-full" />
                <FaSearch className="relative w-16 h-16 mx-auto mb-6 text-[#E2E8F0] dark:text-[#2A2A2A]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0A2E4A] dark:text-white mb-3">
                No alerts match your filters
              </h2>
              <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-sm mx-auto mb-8">
                Try adjusting your search or filter criteria to find what you're looking for.
              </p>
              <Button variant="outline" onClick={clearFilters} className="hover:shadow-md transition-all duration-300">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2D9B6E]/20 to-[#0A2E4A]/20 blur-2xl rounded-full animate-pulse" />
                <FaBell className="relative w-20 h-20 mx-auto mb-6 text-[#E2E8F0] dark:text-[#2A2A2A]" />
              </div>
              <h2 className="text-2xl font-bold text-[#0A2E4A] dark:text-white mb-3">
                All caught up!
              </h2>
              <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-sm mx-auto">
                No alerts to display. When there are updates, delays, or issues with your shipments, they will appear here.
              </p>
            </div>
          )
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
            {alerts.map((userAlert: UserAlert) => {
              const isExpanded = expandedAlerts.has(userAlert.user_alert_id);
              const message = userAlert.alert.alert_message;
              const shouldTruncate = message.length > 150;
              const displayMessage = isExpanded || !shouldTruncate ? message : `${message.slice(0, 150)}...`;

              return (
                <div
                  key={userAlert.user_alert_id}
                  className={cn(
                    'group relative transition-all duration-300 hover:bg-[#F8FAFC] dark:hover:bg-[#1A1E23]',
                    !userAlert.is_read
                      ? 'bg-gradient-to-r from-[#F8FAFC] to-white dark:from-[#1A1E23] dark:to-[#111111]'
                      : 'bg-white dark:bg-[#111111]'
                  )}
                >
                  {!userAlert.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#2D9B6E] to-[#1F7A52] rounded-r-full" />
                  )}
                  
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'p-2.5 rounded-2xl flex-shrink-0 transition-all duration-300',
                          getSeverityColor(userAlert.alert.alert_severity),
                          !userAlert.is_read ? 'ring-2 ring-offset-2 ring-[#2D9B6E]/20' : ''
                        )}
                      >
                        {getSeverityIcon(userAlert.alert.alert_severity, 'w-5 h-5')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <h3
                              className={cn(
                                'text-base font-semibold truncate transition-colors duration-200',
                                !userAlert.is_read
                                  ? 'text-[#0A2E4A] dark:text-white'
                                  : 'text-[#475569] dark:text-[#A3A3A3]'
                              )}
                            >
                              {userAlert.alert.alert_title}
                            </h3>
                            <Badge
                              variant={
                                userAlert.alert.alert_severity === 'critical'
                                  ? 'danger'
                                  : userAlert.alert.alert_severity === 'warning'
                                    ? 'warning'
                                    : 'default'
                              }
                              size="sm"
                              className="shadow-sm"
                            >
                              {userAlert.alert.alert_severity}
                            </Badge>
                            {!userAlert.is_read && (
                              <Badge 
                                variant="primary" 
                                size="sm"
                                className="animate-pulse shadow-sm"
                              >
                                New
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-[#94A3B8] dark:text-[#94A3B8] whitespace-nowrap font-mono">
                            {formatDate(userAlert.notified_at)}
                          </span>
                        </div>

                        <p className={cn(
                          'text-sm leading-relaxed transition-colors duration-200',
                          !userAlert.is_read
                            ? 'text-[#334155] dark:text-[#CBD5E1]'
                            : 'text-[#64748B] dark:text-[#888888]'
                        )}>
                          {displayMessage}
                          {shouldTruncate && (
                            <button
                              onClick={() => toggleExpand(userAlert.user_alert_id)}
                              className="ml-2 text-[#2D9B6E] dark:text-[#3DB87E] hover:text-[#1F7A52] dark:hover:text-[#2D9B6E] font-medium transition-colors duration-200 inline-flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  Show less <FaChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  Read more <FaChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {userAlert.alert.shipment && (
                              <Badge variant="default" size="sm" className="bg-[#F1F5F9] dark:bg-[#1A1A1A] text-[#64748B] dark:text-[#94A3B8]">
                                <span className="font-mono text-xs">
                                  Ref: {userAlert.alert.shipment.shipment_reference_number}
                                </span>
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {!userAlert.is_read && (
                              <button
                                onClick={() => markAsRead.mutate(userAlert.user_alert_id)}
                                disabled={markAsRead.isPending}
                                className="group/read inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-[#2563EB] hover:text-white hover:bg-[#2563EB] dark:text-[#3B82F6] dark:hover:text-white dark:hover:bg-[#3B82F6] rounded-lg transition-all duration-200 hover:shadow-md"
                              >
                                <FaCheck className="w-3.5 h-3.5 group-hover/read:scale-110 transition-transform duration-200" />
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {meta && !isLoading && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] dark:border-[#2A2A2A] bg-gradient-to-r from-[#F8FAFC] to-white dark:from-[#111111] dark:to-[#0A0A0A]">
            <Pagination
              page={meta.page}
              totalPages={meta.totalPages}
              totalItems={meta.totalItems}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
};