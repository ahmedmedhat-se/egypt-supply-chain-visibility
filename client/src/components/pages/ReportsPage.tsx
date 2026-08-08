import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { reportsApi } from '../../api/reports.api';
import type { Report } from '../../api/reports.api';
import { 
  FaFileAlt, 
  FaDownload, 
  FaPlus, 
  FaSpinner, 
  FaExclamationCircle,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaRocket,
  FaCalendarAlt,
  FaUser
} from 'react-icons/fa';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';

interface ReportsResponse {
  data: Report[];
  meta: {
    page: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

const REPORT_TYPE_ICONS: Record<string, { icon: React.ReactNode; label: string }> = {
  shipments_summary: { 
    icon: <FaChartBar className="w-5 h-5" />, 
    label: 'Shipments Summary' 
  },
  performance: { 
    icon: <FaRocket className="w-5 h-5" />, 
    label: 'Performance Report' 
  },
};

const STATUS_CONFIG: Record<string, { 
  icon: React.ReactNode;
  label: string;
  className: string;
}> = {
  completed: {
    icon: <FaCheckCircle className="w-4 h-4" />,
    label: 'Completed',
    className: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30'
  },
  pending: {
    icon: <FaClock className="w-4 h-4 animate-pulse" />,
    label: 'Processing',
    className: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'
  },
  failed: {
    icon: <FaTimesCircle className="w-4 h-4" />,
    label: 'Failed',
    className: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30'
  },
};

export const ReportsPage = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ReportsResponse>({
    queryKey: ['reports', { page, limit }],
    queryFn: async () => {
      const response = await reportsApi.getReports({ page, limit });
      return response.data;
    },
    refetchInterval: (query) => {
      const queryData = query.state.data;
      const hasPending = queryData?.data?.some((report: Report) => report.report_status === 'pending');
      return hasPending ? 5000 : false;
    },
  });

  const generateReport = useMutation({
    mutationFn: (type: string) => reportsApi.generateReport({ reportType: type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report generation started successfully');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to start report generation');
    },
  });

  const downloadReport = useMutation({
    mutationFn: (id: string) => reportsApi.getDownloadUrl(id),
    onSuccess: () => {
      toast.success('Downloading report...');
    },
    onError: (error: ApiError) => {
      toast.error(error.response?.data?.message || 'Failed to download report');
    },
  });

  const reports = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-[#0A2E4A] dark:text-white">
            Reports
          </h1>
          <p className="text-[#94A3B8] dark:text-[#94A3B8] text-sm">
            Generate and export supply chain analytics with ease
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => generateReport.mutate('shipments_summary')}
            isLoading={generateReport.isPending}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#2D9B6E]/0 via-white/20 to-[#2D9B6E]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Summary Report
          </Button>
          <Button
            variant="outline"
            onClick={() => generateReport.mutate('performance')}
            isLoading={generateReport.isPending}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#2D9B6E]/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#2D9B6E]/0 via-[#2D9B6E]/10 to-[#2D9B6E]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
            Performance Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-white dark:bg-[#111111] p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10">
              <FaFileAlt className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white tracking-tight">
                {meta?.totalItems || 0}
              </p>
              <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8] font-medium">
                Total Reports
              </p>
            </div>
          </div>
        </div>
        
        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-white dark:bg-[#111111] p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/10">
              <FaClock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white tracking-tight">
                {reports.filter((report: Report) => report.report_status === 'pending').length}
              </p>
              <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8] font-medium">
                Generating
              </p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-[#2A2A2A] bg-white dark:bg-[#111111] p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10">
              <FaCheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0A2E4A] dark:text-white tracking-tight">
                {reports.filter((report: Report) => report.report_status === 'completed').length}
              </p>
              <p className="text-xs text-[#94A3B8] dark:text-[#94A3B8] font-medium">
                Completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <Card variant="bordered" className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8] animate-pulse">
              Loading reports...
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2D9B6E]/20 to-[#0A2E4A]/20 blur-2xl rounded-full animate-pulse" />
              <FaFileAlt className="relative w-20 h-20 mx-auto mb-6 text-[#E2E8F0] dark:text-[#2A2A2A]" />
            </div>
            <h2 className="text-2xl font-bold text-[#0A2E4A] dark:text-white mb-3">
              No reports generated
            </h2>
            <p className="text-[#94A3B8] dark:text-[#94A3B8] max-w-sm mx-auto">
              Click the buttons above to request a new PDF or Excel report of your data.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
            {reports.map((report: Report) => {
              const statusConfig = STATUS_CONFIG[report.report_status] || STATUS_CONFIG.pending;
              const typeInfo = REPORT_TYPE_ICONS[report.report_type] || { 
                icon: <FaFileAlt className="w-5 h-5" />, 
                label: report.report_type.replace('_', ' ') 
              };

              return (
                <div
                  key={report.report_id}
                  className={cn(
                    'group relative p-5 sm:p-6 transition-all duration-300',
                    'bg-white dark:bg-[#111111]',
                    'hover:bg-gradient-to-r hover:from-[#F8FAFC] hover:to-white dark:hover:from-[#1A1E23] dark:hover:to-[#111111]',
                    'hover:scale-[1.01] hover:shadow-md'
                  )}
                >
                  {report.report_status === 'pending' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500 rounded-r-full animate-pulse" />
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                        'bg-gradient-to-br from-[#F1F5F9] to-[#E8F0F8] dark:from-[#1A1A1A] dark:to-[#222]',
                        'group-hover:shadow-md group-hover:scale-105'
                      )}>
                        {typeInfo.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[#0A2E4A] dark:text-white">
                          {typeInfo.label}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <FaCalendarAlt className="w-3 h-3 text-[#94A3B8]" />
                          <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
                            {formatDate(report.report_created_at)}
                          </p>
                          {report.report_generated_at && (
                            <>
                              <span className="text-[#94A3B8]">•</span>
                              <FaUser className="w-3 h-3 text-[#94A3B8]" />
                              <p className="text-sm text-[#94A3B8] dark:text-[#94A3B8]">
                                Generated {formatDate(report.report_generated_at)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-16 sm:ml-0">
                      <div className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
                        statusConfig.className
                      )}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </div>
                      
                      {report.report_status === 'completed' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadReport.mutate(report.report_id)}
                          isLoading={downloadReport.isPending}
                          className={cn(
                            'group/btn relative overflow-hidden transition-all duration-300',
                            'hover:shadow-md hover:scale-105'
                          )}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-[#2D9B6E]/0 via-[#2D9B6E]/10 to-[#2D9B6E]/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700" />
                          <FaDownload className="mr-2 group-hover/btn:translate-y-[-2px] transition-transform duration-200" />
                          Download
                        </Button>
                      ) : report.report_status === 'pending' ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
                          <FaSpinner className="w-4 h-4 animate-spin" />
                          Generating...
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm font-medium">
                          <FaExclamationCircle className="w-4 h-4" />
                          Failed
                        </div>
                      )}
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