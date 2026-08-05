import cron from 'node-cron';
import { prisma } from '../core/base/base.model';
import { logger } from '../shared/logger/logger';

export function initAttendanceCron() {
  // Run every night at 23:59
  cron.schedule('59 23 * * *', async () => {
    try {
      logger.info('Running end-of-day attendance reconciliation...');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all records from today where clockOutTime is null
      const singlePunches = await prisma.attendanceRecord.findMany({
        where: {
          date: {
            gte: today,
            lte: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
          },
          clockOutTime: null,
          status: 'present'
        }
      });

      if (singlePunches.length > 0) {
        // Mark them as absent because they didn't complete the day
        await prisma.attendanceRecord.updateMany({
          where: {
            id: { in: singlePunches.map(r => r.id) }
          },
          data: {
            status: 'absent'
          }
        });
        logger.info(`Marked ${singlePunches.length} incomplete attendances as absent (Single Punch).`);
      } else {
        logger.info('No missing clock-outs found for today.');
      }
    } catch (error) {
      logger.error('Error in attendance cron job', { error });
    }
  });

  logger.info('Attendance cron job initialized.');
}
