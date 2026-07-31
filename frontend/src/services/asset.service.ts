import { api } from '../lib/api';

export const assetService = {
  getTeamRequests: async () => {
    const res = await api.get('/assets/team-requests');
    return res.data.data;
  },
  updateRequestStatus: async (id: string, status: string) => {
    const res = await api.patch(`/assets/requests/${id}/status`, { status });
    return res.data.data;
  }
};
