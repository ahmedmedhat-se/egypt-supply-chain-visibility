import api from "./client";
import type { PaginatedResponse } from "../types/pagination.types";

export interface Report {
  report_id: string;
  report_type: string;
  report_status: "pending" | "completed" | "failed";
  report_file_path: string | null;
  report_error_message: string | null;
  report_created_at: string;
  report_generated_at: string | null;
}

export const reportsApi = {
  getReports: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    return api.get<PaginatedResponse<Report>>("/api/reports", { params });
  },

  generateReport: async (data: {
    reportType: string;
    parameters?: Record<string, unknown>;
  }) => {
    return api.post<{ success: boolean; message: string; data: Report }>(
      "/api/reports",
      data,
    );
  },

  getDownloadUrl: async (id: string) => {
    return api.get<{ success: boolean; downloadUrl: string }>(
      `/api/reports/${id}/download`,
    );
  },
};
