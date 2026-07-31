export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  HR_MANAGER: 'hr_manager',
  HR_EXECUTIVE: 'hr_executive',
  DEPARTMENT_HEAD: 'department_head',
  TEAM_LEAD: 'team_lead',
  EMPLOYEE: 'employee',
  RECRUITER: 'recruiter',
  FINANCE_MANAGER: 'finance_manager',
  INTERVIEWER: 'interviewer',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
