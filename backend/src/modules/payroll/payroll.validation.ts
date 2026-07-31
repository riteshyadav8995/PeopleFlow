import { z } from 'zod';

const payrollComponentSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
});

export const createSalaryStructureSchema = z.object({
  employeeId: z.string().uuid(),
  baseSalary: z.number().min(0),
  allowances: z.array(payrollComponentSchema),
  deductions: z.array(payrollComponentSchema),
  effectiveDate: z.string().datetime().or(z.string()),
});

export const generatePayrollSchema = z.object({
  organizationId: z.string().uuid(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
});
