export const EVENTS = {
  // Employee lifecycle
  EMPLOYEE_CREATED: 'employee.created',
  EMPLOYEE_UPDATED: 'employee.updated',
  EMPLOYEE_TERMINATED: 'employee.terminated',

  // Recruitment
  APPLICATION_RECEIVED: 'application.received',
  INTERVIEW_SCHEDULED: 'interview.scheduled',
  OFFER_SENT: 'offer.sent',
  OFFER_ACCEPTED: 'offer.accepted',
  OFFER_REJECTED: 'offer.rejected',

  // Onboarding
  ONBOARDING_STARTED: 'onboarding.started',
  ONBOARDING_COMPLETED: 'onboarding.completed',

  // Attendance
  ATTENDANCE_MARKED: 'attendance.marked',
  ATTENDANCE_LOCKED: 'attendance.locked',

  // Leave
  LEAVE_REQUESTED: 'leave.requested',
  LEAVE_APPROVED: 'leave.approved',
  LEAVE_REJECTED: 'leave.rejected',

  // Payroll
  PAYROLL_PROCESSED: 'payroll.processed',
  PAYROLL_APPROVED: 'payroll.approved',
  PAYROLL_PUBLISHED: 'payroll.published',

  // Timesheet
  TIMESHEET_SUBMITTED: 'timesheet.submitted',
  TIMESHEET_APPROVED: 'timesheet.approved',

  // Task
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  TASK_OVERDUE: 'task.overdue',
  TASK_COMPLETED: 'task.completed',
} as const;

export type AppEvent = (typeof EVENTS)[keyof typeof EVENTS];
