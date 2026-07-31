import { api } from '../lib/api';

export const timesheetService = {
  getTimesheets: async () => {
    const res = await api.get('/timesheets');
    return res.data.data;
  },

  logTime: async (payload: { projectId: string; taskId: string; date: string; hours: number }) => {
    const res = await api.post('/timesheets/log', payload);
    return res.data.data;
  },

  submitTimesheet: async (payload: { periodStartDate: string; periodEndDate: string }) => {
    const res = await api.post('/timesheets', payload);
    return res.data.data;
  }
};
