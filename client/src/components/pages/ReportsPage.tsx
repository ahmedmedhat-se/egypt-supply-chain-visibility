import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Pagination } from '../ui/Pagination';
import { reportsApi } from '../../api/reports.api';
import type { Report } from '../../api/reports.api';
import { FaFileAlt, FaDownload, FaPlus, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const ReportsPage = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reports', { page, limit }],
    queryFn: async () => {
      const res = await reportsApi.getReports({ page, limit });
      return res.data;
    },
    refetchInterval: (query) => {
      const queryData = query.state.data as any;
      const hasPending = queryData?.data?.some((r: Report) => r.report_status === 'pending');
      return hasPending ? 5000 : false;
    },
  });

  const generateReport = useMutation({
    mutationFn: (type: string) => reportsApi.generateReport({ reportType: type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Report generation started');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start report generation');
    },
  });

  const downloadReport = useMutation({
    mutationFn: (id: string) => reportsApi.getDownloadUrl(id),
    onSuccess: (res) => {
      // In a real app we'd open the URL or trigger a file download
      toast.success(`Downloading from ${res.data.downloadUrl}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to download report');
    },
  });

  const reports = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2E4A] dark:text-white">Reports</h1>
          <p className="text-[#94A3B8] mt-1">Generate and export supply chain analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => generateReport.mutate('shipments_summary')}
            isLoading={generateReport.isPending}
          >
            <FaPlus className="mr-2" />
            Generate Summary
          </Button>
          <Button
            variant="outline"
            onClick={() => generateReport.mutate('performance')}
            isLoading={generateReport.isPending}
          >
            <FaPlus className="mr-2" />
            Generate Performance
          </Button>
        </div>
      </div>

      <Card variant="bordered" className="overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center">
            <FaFileAlt className="w-16 h-16 mx-auto mb-4 text-[#E2E8F0] dark:text-[#2A2A2A]" />
            <h2 className="text-xl font-semibold text-[#0A2E4A] dark:text-white mb-2">No reports generated</h2>
            <p className="text-[#94A3B8] max-w-sm mx-auto">
              Click one of the buttons above to request a new PDF/Excel report of your data.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#2A2A2A]">
            {reports.map((report: Report) => (
              <div key={report.report_id} className="p-4 sm:p-6 bg-white dark:bg-[#111111] hover:bg-[#F8FAFC] dark:hover:bg-[#151515] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] dark:bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                      <FaFileAlt className="w-6 h-6 text-[#94A3B8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#0A2E4A] dark:text-white capitalize">
                        {report.report_type.replace('_', ' ')} Report
                      </h3>
                      <p className="text-sm text-[#94A3B8] mt-0.5">
                        Requested on {formatDate(report.report_created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-16 sm:ml-0">
                    <Badge
                      variant={report.report_status === 'completed' ? 'success' : report.report_status === 'failed' ? 'danger' : 'warning'}
                      className="capitalize"
                    >
                      {report.report_status}
                    </Badge>
                    
                    {report.report_status === 'completed' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadReport.mutate(report.report_id)}
                        isLoading={downloadReport.isPending}
                      >
                        <FaDownload className="mr-2" />
                        Download
                      </Button>
                    ) : report.report_status === 'pending' ? (
                      <div className="px-3 py-1.5 flex items-center gap-2 text-sm text-[#94A3B8]">
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Generating...
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 flex items-center gap-2 text-sm text-[#EF4444]">
                        <FaExclamationCircle className="w-4 h-4" />
                        Failed
                      </div>
                    )}
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
