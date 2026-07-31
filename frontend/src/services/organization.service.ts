import { api } from '../lib/api';

export const organizationService = {
  // Branches
  getBranches: async (organizationId: string) => {
    const { data } = await api.get(`/branches?organizationId=${organizationId}`);
    return data.data;
  },
  createBranch: async (payload: any) => {
    const { data } = await api.post('/branches', payload);
    return data.data;
  },
  deleteBranch: async (id: string) => {
    const { data } = await api.delete(`/branches/${id}`);
    return data.data;
  },

  // Departments
  getDepartments: async (organizationId: string) => {
    const { data } = await api.get(`/departments?organizationId=${organizationId}`);
    return data.data;
  },
  createDepartment: async (payload: any) => {
    const { data } = await api.post('/departments', payload);
    return data.data;
  },
  deleteDepartment: async (id: string) => {
    const { data } = await api.delete(`/departments/${id}`);
    return data.data;
  },

  // Designations
  getDesignations: async (organizationId: string) => {
    const { data } = await api.get(`/designations?organizationId=${organizationId}`);
    return data.data;
  },
  createDesignation: async (payload: any) => {
    const { data } = await api.post('/designations', payload);
    return data.data;
  },
  deleteDesignation: async (id: string) => {
    const { data } = await api.delete(`/designations/${id}`);
    return data.data;
  },
};
