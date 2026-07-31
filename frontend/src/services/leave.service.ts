import { api } from '../lib/api';

export const leaveService = {
  getTypes: async (organizationId: string) => {
    const { data } = await api.get(`/leave/types?organizationId=${organizationId}`);
    return data.data;
  },
  getBalances: async (organizationId: string, year: number) => {
    const { data } = await api.get(`/leave/balances?organizationId=${organizationId}&year=${year}`);
    return data.data;
  },
  requestLeave: async (payload: any) => {
    const { data } = await api.post('/leave/request', payload);
    return data.data;
  },
  getMyRequests: async (organizationId: string) => {
    const { data } = await api.get(`/leave/my-requests?organizationId=${organizationId}`);
    return data.data;
  },
  getPendingApprovals: async (organizationId: string) => {
    const { data } = await api.get(`/leave/pending-approvals?organizationId=${organizationId}`);
    return data.data;
  },
  reviewLeave: async (id: string, data: { status: 'approved' | 'rejected', rejectionReason?: string }) => {
    const res = await api.put(`/leave/review/${id}`, data);
    return res.data.data;
  },

  async getOrgDashboardStats(orgId: string) {
    const res = await api.get(`/leave/dashboard?organizationId=${orgId}`);
    return res.data.data;
  },

  async getOrgLeaveRequests(orgId: string, filters?: { status?: string, type?: string, search?: string }) {
    let url = `/leave/requests/all?organizationId=${orgId}`;
    if (filters?.status) url += `&status=${filters.status}`;
    if (filters?.type) url += `&type=${filters.type}`;
    if (filters?.search) url += `&search=${encodeURIComponent(filters.search)}`;
    const res = await api.get(url);
    return res.data.data;
  },

  async getOrgLeaveCalendar(orgId: string, month: number, year: number) {
    const res = await api.get(`/leave/calendar?organizationId=${orgId}&month=${month}&year=${year}`);
    return res.data.data;
  },

  async getMonthlyLeaveTrend(orgId: string, year: number) {
    const res = await api.get(`/leave/analytics/trend?organizationId=${orgId}&year=${year}`);
    return res.data.data;
  },

  async getDepartmentLeaveDistribution(orgId: string) {
    const res = await api.get(`/leave/analytics/department-distribution?organizationId=${orgId}`);
    return res.data.data;
  },

  async getDepartmentSummary(orgId: string, year: number) {
    const res = await api.get(`/leave/analytics/department-summary?organizationId=${orgId}&year=${year}`);
    return res.data.data;
  },

  async getLeavePolicies(orgId: string) {
    const res = await api.get(`/leave/policies?organizationId=${orgId}`);
    return res.data.data;
  },

  async createLeavePolicy(data: any) {
    const res = await api.post('/leave/policies', data);
    return res.data.data;
  },

  async getUpcomingEvents(orgId: string) {
    const res = await api.get(`/leave/events?organizationId=${orgId}`);
    return res.data.data;
  },

  async getLeaveBalanceExceptions(orgId: string) {
    const res = await api.get(`/leave/exceptions?organizationId=${orgId}`);
    return res.data.data;
  }
};
