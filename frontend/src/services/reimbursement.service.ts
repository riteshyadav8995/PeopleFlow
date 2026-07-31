import { api } from '../lib/api';

export const reimbursementService = {
  getTeamClaims: async (organizationId?: string) => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get('/reimbursements/team-claims', { params });
    return res.data.data;
  },
  updateClaimStatus: async (id: string, status: string) => {
    const res = await api.patch(`/reimbursements/${id}/status`, { status });
    return res.data.data;
  }
};
