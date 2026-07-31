import { api } from '../lib/api';

export interface PayrollComponent {
  name: string;
  amount: number;
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  baseSalary: number;
  allowances: PayrollComponent[];
  deductions: PayrollComponent[];
  effectiveDate: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: { title: string };
    department?: { name: string };
  };
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netPay: number;
  breakdown: {
    baseSalary: number;
    allowances: PayrollComponent[];
    deductions: PayrollComponent[];
  };
  status: string;
  paymentDate?: string;
  employee?: {
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation?: { title: string };
    department?: { name: string };
  };
}

export const payrollService = {
  getSalaryStructure: async (employeeId: string) => {
    const { data } = await api.get<{ data: SalaryStructure }>(`/payroll/structures/${employeeId}`);
    return data.data;
  },

  upsertSalaryStructure: async (payload: { 
    employeeId: string; 
    baseSalary: number; 
    allowances: PayrollComponent[]; 
    deductions: PayrollComponent[]; 
    effectiveDate: string 
  }) => {
    const { data } = await api.post<{ data: SalaryStructure }>('/payroll/structures', payload);
    return data.data;
  },

  generatePayrollRun: async (payload: { organizationId: string; month: number; year: number; groupId?: string; periodId?: string }) => {
    const { data } = await api.post<{ data: any, message: string }>('/payroll/runs/generate', payload);
    return data;
  },

  approvePayrollRun: async (runId: string) => {
    const { data } = await api.post<{ data: any, message: string }>(`/payroll/runs/${runId}/approve`);
    return data;
  },

  publishPayrollRun: async (runId: string) => {
    const { data } = await api.post<{ data: any, message: string }>(`/payroll/runs/${runId}/publish`);
    return data;
  },

  getPayslips: async (organizationId: string, month?: number, year?: number) => {
    let url = `/payroll/payslips?organizationId=${organizationId}`;
    if (month) url += `&month=${month}`;
    if (year) url += `&year=${year}`;
    const { data } = await api.get<{ data: Payslip[] }>(url);
    return data.data;
  },

  getMyPayslips: async (employeeId: string, organizationId: string) => {
    const { data } = await api.get<{ data: Payslip[] }>(`/payroll/payslips?organizationId=${organizationId}&employeeId=${employeeId}`);
    return data.data;
  }
};
