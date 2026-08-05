import cron from 'node-cron';
import { PayrollService } from '../modules/payroll/payroll.service';

const payrollService = new PayrollService();
import { logger } from '../shared/logger/logger';

export function initPayrollCron() {
  // Run at 15:00 (3 PM) every day
  cron.schedule('0 15 * * *', async () => {
    try {
      const now = new Date();
      // Check if today is the last day of the month
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      if (now.getDate() === lastDayOfMonth) {
        logger.info('Running end-of-month automatic payroll generation...');
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        await payrollService.autoGeneratePayroll(currentMonth, currentYear);
        logger.info('Automatic payroll generation completed.');
      } else {
        logger.debug('Skipping payroll cron: Not the last day of the month.');
      }
    } catch (error) {
      logger.error('Error in automatic payroll cron job', { error });
    }
  });

  logger.info('Payroll cron job initialized.');
}
