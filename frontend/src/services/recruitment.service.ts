import { api } from '../lib/api';

export const recruitmentService = {
  getInterviews: async (organizationId?: string) => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get('/recruitment/interviews', { params });
    return res.data.data;
  },
  getCandidates: async (organizationId?: string) => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get('/recruitment/candidates', { params });
    return res.data.data;
  }
};
