/**
 * Permission actions follow the pattern: resource:action
 * e.g. "employee:read", "payroll:approve"
 */
export const PERMISSIONS = {
  // Employee
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',

  // Attendance
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_APPROVE: 'attendance:approve',

  // Leave
  LEAVE_REQUEST: 'leave:request',
  LEAVE_APPROVE: 'leave:approve',
  LEAVE_MANAGE: 'leave:manage',

  // Recruitment
  RECRUITMENT_CREATE: 'recruitment:create',
  RECRUITMENT_READ: 'recruitment:read',
  RECRUITMENT_MANAGE: 'recruitment:manage',

  // Payroll
  PAYROLL_VIEW: 'payroll:view',
  PAYROLL_PROCESS: 'payroll:process',
  PAYROLL_APPROVE: 'payroll:approve',

  // Reports
  REPORT_VIEW: 'report:view',
  REPORT_EXPORT: 'report:export',

  // Settings
  SETTINGS_MANAGE: 'settings:manage',

  // Users
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Roles
  ROLE_MANAGE: 'role:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
