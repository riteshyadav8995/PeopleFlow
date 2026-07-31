import { api } from '../lib/api';

export const reimbursementService = {
  getMyClaims: async (organizationId?: string) => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get('/reimbursements', { params });
    return res.data.data;
  },
  submitClaim: async (organizationId: string | undefined, data: any) => {
    const res = await api.post('/reimbursements', { ...data, organizationId });
    return res.data.data;
  },
  getTeamClaims: async (organizationId?: string) => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get('/reimbursements/team-claims', { params });
    return res.data.data;
  },
  getAllClaims: async (organizationId?: string) => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get('/reimbursements/all-claims', { params });
    return res.data.data;
  },
  updateClaimStatus: async (orgId: string, id: string, status: string, notes?: string) => {
    const res = await api.patch(`/reimbursements/${id}/status`, { status, notes, organizationId: orgId });
    return res.data.data;
  }
};
