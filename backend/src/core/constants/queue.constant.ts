export const QUEUES = {
  PAYROLL: 'payroll-processing',
  PAYSLIP: 'payslip-generation',
  NOTIFICATION: 'notification-dispatch',
  VOICE_CALL: 'voice-call-execution',
  DOCUMENT: 'document-processing',
  REPORT: 'report-generation',
  IMPORT: 'data-import',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
