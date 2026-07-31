import { api } from '../lib/api';

export const employeeService = {
  getEmployees: async (organizationId: string) => {
    const { data } = await api.get(`/employees?organizationId=${organizationId}`);
    return data.data;
  },
  getEmployeeById: async (id: string) => {
    const { data } = await api.get(`/employees/${id}`);
    return data.data;
  },
  createEmployee: async (payload: any) => {
    const { data } = await api.post('/employees', payload);
    return data.data;
  },
  updateEmployee: async (id: string, payload: any) => {
    const { data } = await api.put(`/employees/${id}`, payload);
    return data.data;
  },
  deleteEmployee: async (id: string) => {
    const { data } = await api.delete(`/employees/${id}`);
    return data.data;
  },
  getTeamMetrics: async (organizationId: string) => {
    const { data } = await api.get(`/employees/reports/team-metrics?organizationId=${organizationId}`);
    return data.data;
  },
};
