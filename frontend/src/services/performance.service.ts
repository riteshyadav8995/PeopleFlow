import { api } from '../lib/api';

export const performanceService = {
  // Goals
  getTeamGoals: async () => {
    const res = await api.get('/performance/goals');
    return res.data.data;
  },
  createGoal: async (payload: any) => {
    const res = await api.post('/performance/goals', payload);
    return res.data.data;
  },
  deleteGoal: async (id: string) => {
    const res = await api.delete(`/performance/goals/${id}`);
    return res.data.data;
  },

  // Feedback
  getTeamFeedback: async () => {
    const res = await api.get('/performance/feedback');
    return res.data.data;
  },
  createFeedback: async (payload: any) => {
    const res = await api.post('/performance/feedback', payload);
    return res.data.data;
  },
  deleteFeedback: async (id: string) => {
    const res = await api.delete(`/performance/feedback/${id}`);
    return res.data.data;
  },

  // Meetings
  getTeamMeetings: async () => {
    const res = await api.get('/performance/meetings');
    return res.data.data;
  },
  createMeeting: async (payload: any) => {
    const res = await api.post('/performance/meetings', payload);
    return res.data.data;
  },
  completeMeeting: async (id: string) => {
    const res = await api.patch(`/performance/meetings/${id}/complete`);
    return res.data.data;
  }
};
