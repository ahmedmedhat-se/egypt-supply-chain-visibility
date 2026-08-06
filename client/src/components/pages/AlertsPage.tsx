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

export const AlertsPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const limit = 10;
  const queryClient = useQueryClient();

  // Debounced search — applies 350ms after the user stops typing.
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

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Alerts</h1>
          <p className="text-[#94A3B8] mt-1">Your notification center</p>
        </div>
        {alerts.some((a: UserAlert) => !a.is_read) && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            isLoading={markAllAsRead.isPending}
          >
            <FaCheck className="mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 dark:border-[#2A2A2A] dark:bg-[#111111]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40">
            <FaBell className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">{unreadCount}</p>
            <p className="text-xs text-[#94A3B8]">Unread alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-[#E2E8F0] bg-white p-4 dark:border-[#2A2A2A] dark:bg-[#111111]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40">
            <FaInbox className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white">
              {meta?.totalItems ?? 0}
            </p>
            <p className="text-xs text-[#94A3B8]">
              {hasActiveFilters ? 'Results in view' : 'Total alerts'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <Card variant="bordered" className="p-4">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, message, or shipment reference..."
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-[#D1D9E6] dark:border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#2D9B6E] focus:border-transparent text-sm bg-white dark:bg-[#111111] text-[#1A2A3A] dark:text-white placeholder:text-[#94A3B8]"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                aria-label="Clear search"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Read status segmented control */}
            <div className="inline-flex rounded-lg border border-[#E2E8F0] dark:border-[#2A2A2A] overflow-hidden">
              {(['all', 'unread', 'read'] as ReadFilter[]).map((value) => (
                <button
                  key={value}
                  onClick={() => setRead(value)}
                  className={cn(
                    'px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                    readFilter === value
                      ? 'bg-[#2D9B6E] text-white'
                      : 'bg-white dark:bg-[#111111] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1A1A1A]'
                  )}
                >
                  {value}
                </button>
              ))}
            </div>

            {/* Severity chips */}
            <div className="flex flex-wrap items-center gap-2">
              {SEVERITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSeverity(option.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    severityFilter === option.value
                      ? 'bg-[#0A2E4A] text-white dark:bg-white dark:text-[#0A2E4A] shadow'
                      : 'bg-[#F1F5F9] dark:bg-[#1A1A1A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#E8F0F8] dark:hover:bg-[#222]'
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2] dark:hover:bg-[#991B1B]/20 transition-colors"
                >
                  <FaTimes className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Alerts list */}
      <Card variant="bordered" className="overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#1A1A1A]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 sm:p-6 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/5 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                  <div className="h-3 w-3/4 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                  <div className="h-3 w-1/3 rounded bg-[#F1F5F9] dark:bg-[#1A1A1A]" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          hasActiveFilters ? (
            <div className="py-16 text-center">
              <FaSearch className="w-14 h-14 mx-auto mb-4 text-[#E2E8F0] dark:text-[#2A2A2A]" />
              <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">
                No alerts match your filters
              </h2>
              <p className="text-[#94A3B8] max-w-sm mx-auto mb-6">
                Try a different search term or clear the filters to see more alerts.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="py-16 text-center">
              <FaBell className="w-16 h-16 mx-auto mb-4 text-[#E2E8F0] dark:text-[#2A2A2A]" />
              <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">No alerts yet</h2>
              <p className="text-[#94A3B8] max-w-sm mx-auto">
                When there are updates, delays, or issues with your shipments, they will appear here.
              </p>
            </div>
          )
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
            {alerts.map((userAlert: UserAlert) => (
              <div
                key={userAlert.user_alert_id}
                className={cn(
                  'p-4 sm:p-6 transition-colors duration-200',
                  !userAlert.is_read
                    ? 'bg-[#F8FAFC] dark:bg-[#1A1E23]'
                    : 'bg-white dark:bg-[#111111] hover:bg-[#F8FAFC] dark:hover:bg-[#151515]'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-2 rounded-xl flex-shrink-0',
                      !userAlert.is_read
                        ? 'bg-white dark:bg-[#2A2A2A] shadow-sm'
                        : 'bg-[#F1F5F9] dark:bg-[#1A1A1A]'
                    )}
                  >
                    {getSeverityIcon(userAlert.alert.alert_severity, 'w-5 h-5')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3
                          className={cn(
                            'text-base font-semibold truncate',
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
                        >
                          {userAlert.alert.alert_severity}
                        </Badge>
                      </div>
                      <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                        {formatDate(userAlert.notified_at)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-sm mb-3',
                        !userAlert.is_read
                          ? 'text-[#334155] dark:text-[#CBD5E1]'
                          : 'text-[#64748B] dark:text-[#888888]'
                      )}
                    >
                      {userAlert.alert.alert_message}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-2">
                        {userAlert.alert.shipment && (
                          <Badge variant="default" size="sm">
                            Ref: {userAlert.alert.shipment.shipment_reference_number}
                          </Badge>
                        )}
                        {!userAlert.is_read && (
                          <Badge variant="primary" size="sm">New</Badge>
                        )}
                      </div>

                      {!userAlert.is_read && (
                        <button
                          onClick={() => markAsRead.mutate(userAlert.user_alert_id)}
                          disabled={markAsRead.isPending}
                          className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] dark:text-[#3B82F6] dark:hover:text-[#60A5FA] transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta && !isLoading && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] dark:border-[#2A2A2A] bg-[#F8FAFC] dark:bg-[#111111]">
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
