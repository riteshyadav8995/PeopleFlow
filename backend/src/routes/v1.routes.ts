import { Router } from 'express';
import { authRoutes } from '../modules/auth';
import { tenantRoutes } from '../modules/tenant';
import { userRoutes } from '../modules/user';
import { branchRoutes } from '../modules/branch';
import { departmentRoutes } from '../modules/department';
import { designationRoutes } from '../modules/designation';
import { employeeRoutes } from '../modules/employee';
import { attendanceRoutes } from '../modules/attendance';
import { leaveRoutes } from '../modules/leave';
import { payrollRoutes } from '../modules/payroll';
import { superAdminRoutes } from '../modules/superadmin';
import { organizationAdminRoutes } from '../modules/organization-admin';
import { recruitmentRoutes } from '../modules/recruitment';
import { onboardingRoutes } from '../modules/onboarding';
import { projectRoutes } from '../modules/project';
import { taskRoutes } from '../modules/task';
import { timesheetRoutes } from '../modules/timesheet';
import { voiceAgentRoutes } from '../modules/voice-agent';
import { dashboardRoutes } from '../modules/dashboard';
import { reimbursementRoutes } from '../modules/reimbursement';
import performanceRoutes from '../modules/performance/performance.routes';
import assetRoutes from '../modules/asset/asset.routes';
import aiRoutes from './ai.routes';
import { cacheResponse } from '../middleware/cache.middleware';

const router = Router();

// ─── Auth (public + protected) ──────────────
router.use('/auth', authRoutes);

// ─── Tenants ────────────────────────────────
router.use('/tenants', tenantRoutes);

// ─── Users ──────────────────────────────────
router.use('/users', userRoutes);

// ─── Organization & Employee ────────────────
router.use('/branches', branchRoutes);
router.use('/departments', departmentRoutes);
router.use('/designations', designationRoutes);
// Cache employee lists for 30 seconds globally
router.use('/employees', cacheResponse(30), employeeRoutes);
router.use('/employee', cacheResponse(30), employeeRoutes); // Alias for frontend manager views

// ─── Attendance & Leave ─────────────────────
router.use('/attendance', cacheResponse(30), attendanceRoutes);
router.use('/leave', cacheResponse(30), leaveRoutes);

// ─── Payroll ────────────────────────────────
router.use('/payroll', cacheResponse(30), payrollRoutes);
router.use('/reimbursements', reimbursementRoutes);

// ─── Super Admin ────────────────────────────
router.use('/superadmin', superAdminRoutes);

// ─── Organization Admin ─────────────────────
router.use('/organization-admin', organizationAdminRoutes);

// ─── Recruitment ────────────────────────────
router.use('/recruitment', recruitmentRoutes);

// ─── Onboarding ─────────────────────────────
router.use('/onboarding', onboardingRoutes);

// ─── Project Collaboration ──────────────────
router.use('/projects', cacheResponse(30), projectRoutes);
router.use('/tasks', cacheResponse(30), taskRoutes);
router.use('/timesheets', timesheetRoutes);

// ─── AI Voice Agent ─────────────────────────
router.use('/voice-agent', voiceAgentRoutes);

// ─── Dashboard ──────────────────────────────
router.use('/dashboard', dashboardRoutes);

// ─── Performance ────────────────────────────
router.use('/performance', performanceRoutes);

// ─── Assets ──────────────────────────────────
router.use('/assets', assetRoutes);

// ─── AI Assistant ───────────────────────────
router.use('/ai', aiRoutes);

export default router;
