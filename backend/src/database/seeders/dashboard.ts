import * as dotenv from 'dotenv';
dotenv.config();

import { prisma, connectDatabase, disconnectDatabase } from '../../core/base/base.model';

export const seedDashboard = async () => {
  await connectDatabase();
  const users = await prisma.user.findMany({ include: { employee: true } });
  
  for (const user of users) {
    if (!user.tenantId || !user.employee) continue;
    
    const tenantId = user.tenantId;
    const organizationId = user.employee.organizationId;
    const employeeId = user.employee.id;

    console.log(`Seeding dashboard data for user ${user.email}`);

    // Seed Notifications
    await prisma.notification.createMany({
      data: [
        {
          tenantId,
          organizationId,
          userId: user.id,
          title: 'Welcome to PeopleFlow',
          message: 'Your new HRMS dashboard is ready.',
          type: 'SUCCESS'
        },
        {
          tenantId,
          organizationId,
          userId: user.id,
          title: 'Timesheet Reminder',
          message: 'Please submit your timesheet for this week.',
          type: 'WARNING',
          link: '/organization/timesheets'
        }
      ]
    });

    // Seed Announcements
    await prisma.announcement.createMany({
      data: [
        {
          tenantId,
          organizationId,
          title: 'Q3 Townhall Meeting',
          content: 'Join us for the Q3 townhall next Friday. We will discuss our latest product roadmap.',
          priority: 'HIGH'
        },
        {
          tenantId,
          organizationId,
          title: 'New Office Policy',
          content: 'The new office policy document has been uploaded. Please review it by end of week.',
          priority: 'NORMAL'
        }
      ]
    });

    // Seed Holidays
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(today.getMonth() + 1);
    
    await prisma.holiday.createMany({
      data: [
        {
          tenantId,
          organizationId,
          name: 'Company Retreat',
          date: nextMonth,
          type: 'COMPANY'
        },
        {
          tenantId,
          organizationId,
          name: 'Independence Day',
          date: new Date(today.getFullYear(), 7, 15),
          type: 'PUBLIC'
        }
      ]
    });

    // Seed Meetings
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    await prisma.meeting.create({
      data: {
        tenantId,
        organizationId,
        organizerId: employeeId,
        title: 'Weekly Sync',
        description: 'Discussing sprint progress',
        startTime,
        endTime,
        meetLink: 'https://meet.google.com/abc-defg-hij',
        status: 'SCHEDULED',
        attendees: JSON.stringify([employeeId])
      }
    });

    // Seed Documents
    await prisma.document.createMany({
      data: [
        {
          tenantId,
          organizationId,
          employeeId,
          name: 'Offer Letter.pdf',
          fileUrl: '/dummy.pdf',
          type: 'CONTRACT'
        },
        {
          tenantId,
          organizationId,
          employeeId,
          name: 'Payslip_May.pdf',
          fileUrl: '/dummy.pdf',
          type: 'PAYSLIP'
        }
      ]
    });
  }
  await disconnectDatabase();
}


