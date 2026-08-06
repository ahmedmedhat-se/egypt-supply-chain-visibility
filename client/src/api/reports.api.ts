import api from './client';

export interface Report {
  report_id: string;
  report_type: string;
  report_status: 'pending' | 'completed' | 'failed';
  report_file_path: string | null;
  report_error_message: string | null;
  report_created_at: string;
  report_generated_at: string | null;
}

export const reportsApi = {
  getReports: async (params?: { page?: number; limit?: number; status?: string }) => {
    return api.get<{ data: Report[]; meta: any }>('/reports', { params });
  },

  generateReport: async (data: { reportType: string; parameters?: any }) => {
    return api.post<{ success: boolean; message: string; data: Report }>('/reports', data);
  },

  getDownloadUrl: async (id: string) => {
    return api.get<{ success: boolean; downloadUrl: string }>(`/reports/${id}/download`);
  },
};
