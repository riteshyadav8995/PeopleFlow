import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { validate } from '../../middleware/validation.middleware';
import { clockInSchema, clockOutSchema } from './attendance.validation';
import { authenticationMiddleware } from '../../middleware/authentication.middleware';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

import { authorize } from '../../middleware/authorization.middleware';

const router = Router();
const attendanceController = new AttendanceController();

router.use(authenticationMiddleware, tenantMiddleware);

router.post('/clock-in', authorize('attendance.self:mark'), validate(clockInSchema), attendanceController.clockIn);
router.post('/clock-out', authorize('attendance.self:mark'), validate(clockOutSchema), attendanceController.clockOut);
router.get('/', authorize('attendance.self:read'), attendanceController.listAttendance);
router.get('/dashboard', authorize('attendance.manage:read'), attendanceController.getDashboardStats);
router.get('/trends', authorize('attendance.manage:read'), attendanceController.getTrends);
router.get('/exceptions', authorize('attendance.manage:read'), attendanceController.getExceptions);
router.post('/exceptions/:id/resolve', authorize('attendance.manage:update'), attendanceController.resolveException);
router.get('/reports/monthly', authorize('attendance.manage:read'), attendanceController.getMonthlyReport);

// Attendance Corrections
router.post('/corrections', authorize('attendance.self:mark'), attendanceController.createCorrection);
router.get('/corrections', authorize('attendance.self:mark'), attendanceController.listCorrections);
router.post('/corrections/:id/approve', authorize('attendance.manage:update'), attendanceController.approveCorrection);
router.post('/corrections/:id/reject', authorize('attendance.manage:update'), attendanceController.rejectCorrection);

export default router;
