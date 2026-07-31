export interface PayrollComponent {
  name: string;
  amount: number;
}

export interface CreateSalaryStructureInput {
  employeeId: string;
  baseSalary: number;
  allowances: PayrollComponent[];
  deductions: PayrollComponent[];
  effectiveDate: string;
}

export interface GeneratePayrollInput {
  organizationId: string;
  month: number;
  year: number;
}
