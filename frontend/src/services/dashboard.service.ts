import { api } from '../lib/api';

export const dashboardService = {
  getEmployeeDashboard: async (organizationId: string) => {
    const response = await api.get('/dashboard/employee', {
      params: { organizationId }
    });
    return response.data.data;
  },

  markNotificationRead: async (id: string) => {
    const response = await api.patch(`/dashboard/notifications/${id}/read`);
    return response.data.data;
  },

  getOrganizationDashboardStats: async () => {
    const response = await api.get('/organization-admin/dashboard');
    return response.data.data;
  },

  getOrganizationApprovals: async () => {
    const response = await api.get('/organization-admin/approvals');
    return response.data.data;
  },

  generateOrganizationReport: async () => {
    const response = await api.post('/organization-admin/report');
    return response.data.data;
  }
};
