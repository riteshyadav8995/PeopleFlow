import { Request, Response, NextFunction } from 'express';
import { TimesheetService } from './timesheet.service';
import { BaseController } from '../../core/base/base.controller';
import { AuthenticatedRequest } from '../../core/interfaces/authenticated-request.interface';

export class TimesheetController extends BaseController {
  private timesheetService = new TimesheetService();

  submitTimesheet = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const timesheet = await this.timesheetService.submitTimesheet(context, req.body);
    res.status(201).json({ data: timesheet, message: 'Timesheet submitted successfully' });
  });

  getTimesheets = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const timesheets = await this.timesheetService.getTimesheets(context);
    res.json({ data: timesheets });
  });

  approveTimesheet = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const timesheet = await this.timesheetService.approveTimesheet(context, req.params.id as string);
    res.json({ data: timesheet, message: 'Timesheet approved' });
  });

  logTime = this.asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const context = this.getServiceContext(authReq);
    const timeEntry = await this.timesheetService.logTime(context, req.body);
    res.status(201).json({ data: timeEntry, message: 'Time logged successfully' });
  });
}
