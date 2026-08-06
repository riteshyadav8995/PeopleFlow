import { api } from '../lib/api';

export const attendanceService = {
  clockIn: async (payload: { organizationId: string; latitude?: number; longitude?: number }) => {
    const { data } = await api.post('/attendance/clock-in', payload);
    return data.data;
  },
  clockOut: async (payload: { latitude?: number; longitude?: number }) => {
    const { data } = await api.post('/attendance/clock-out', payload);
    return data.data;
  },
  getMyAttendance: async (orgId: string, month: number, year: number) => {
    const res = await api.get(`/attendance?organizationId=${orgId}&month=${month}&year=${year}&employeeId=me`);
    return res.data.data;
  },

  async getOrgDashboardStats(orgId: string) {
    const res = await api.get(`/attendance/dashboard?organizationId=${orgId}`);
    return res.data.data;
  },

  async getOrgTrends(orgId: string) {
    const res = await api.get(`/attendance/trends?organizationId=${orgId}`);
    return res.data.data;
  },

  async getOrgExceptions(orgId: string) {
    const res = await api.get(`/attendance/exceptions?organizationId=${orgId}`);
    return res.data.data;
  },

  async resolveException(recordId: string) {
    const res = await api.post(`/attendance/exceptions/${recordId}/resolve`);
    return res.data.data;
  },

  async getMonthlyReport(orgId: string, month: number, year: number) {
    const res = await api.get(`/attendance/reports/monthly`, {
      params: { organizationId: orgId, month, year }
    });
    return res.data.data;
  }
};
