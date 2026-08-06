import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { alertsApi } from '../../api/alerts.api';
import type { UserAlert } from '../../api/alerts.api';
import { FaBell, FaCheck, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const AlertsPage = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['alerts', { page, limit }],
    queryFn: async () => {
      const res = await alertsApi.getAlerts({ page, limit });
      return res.data;
    },
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => alertsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark alert as read');
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => alertsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-alerts-count'] });
      toast.success('All alerts marked as read');
    },
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <FaExclamationCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <FaInfoCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const alerts = data?.data || [];
  const meta = data?.meta;
  const hasUnread = alerts.some((a: UserAlert) => !a.is_read);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Alerts</h1>
          <p className="text-[#94A3B8] mt-1">Your notification center</p>
        </div>
        {hasUnread && (
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

      <Card variant="bordered" className="overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center">
            <FaBell className="w-16 h-16 mx-auto mb-4 text-[#E2E8F0] dark:text-[#2A2A2A]" />
            <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">No alerts yet</h2>
            <p className="text-[#94A3B8] max-w-sm mx-auto">
              When there are updates, delays, or issues with your shipments, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
            {alerts.map((userAlert: UserAlert) => (
              <div
                key={userAlert.user_alert_id}
                className={`p-4 sm:p-6 transition-colors duration-200 ${
                  !userAlert.is_read
                    ? 'bg-[#F8FAFC] dark:bg-[#1A1E23]'
                    : 'bg-white dark:bg-[#111111] hover:bg-[#F8FAFC] dark:hover:bg-[#151515]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${!userAlert.is_read ? 'bg-white dark:bg-[#2A2A2A] shadow-sm' : 'bg-[#F1F5F9] dark:bg-[#1A1A1A]'}`}>
                    {getSeverityIcon(userAlert.alert.alert_severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h3 className={`text-base font-semibold truncate ${!userAlert.is_read ? 'text-[#0A2E4A] dark:text-white' : 'text-[#475569] dark:text-[#A3A3A3]'}`}>
                        {userAlert.alert.alert_title}
                      </h3>
                      <span className="text-xs text-[#94A3B8] whitespace-nowrap">
                        {formatDate(userAlert.notified_at)}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-3 ${!userAlert.is_read ? 'text-[#334155] dark:text-[#CBD5E1]' : 'text-[#64748B] dark:text-[#888888]'}`}>
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
