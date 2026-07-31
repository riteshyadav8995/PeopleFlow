import { api } from '../lib/api';

export const onboardingService = {
  getWorkflows: async (organizationId?: string) => {
    const params = organizationId ? { organizationId } : {};
    const res = await api.get('/onboarding/workflows', { params });
    return res.data.data;
  },

  getMyTasks: async () => {
    const res = await api.get('/onboarding/tasks/me');
    return res.data.data;
  },

  completeTask: async (id: string) => {
    const res = await api.patch(`/onboarding/tasks/${id}/complete`);
    return res.data.data;
  }
};
