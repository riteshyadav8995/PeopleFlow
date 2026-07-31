import { Router } from 'express';
import { prisma } from '../core/base/base.model';
import { logger } from '../shared/logger/logger';
import bcrypt from 'bcryptjs';

const router = Router();

// ─── PUBLIC JOB LISTINGS ────────────────────

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await prisma.jobPosting.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        _count: { select: { applications: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: jobs });
  } catch (error) {
    logger.error('Failed to fetch public jobs', { error });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await prisma.jobPosting.findFirst({
      where: { 
        id: req.params.id,
        status: 'PUBLISHED'
      }
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    logger.error('Failed to fetch job details', { error });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── CANDIDATE AUTH (OTP) ───────────────────

import { sendOTP, sendApplicationConfirmationEmail } from '../shared/utils/mailer';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.validation';

// Send OTP
router.post('/auth/send-otp', async (req, res) => {
  const { email, firstName, lastName } = req.body;
  
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.oTPAuth.create({
      data: { email, otp, expiresAt }
    });

    const sent = await sendOTP(email, otp);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP email' });
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    logger.error('Send OTP error', { error });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Verify OTP & Login/Register
router.post('/auth/verify-otp', async (req, res) => {
  const { email, otp, firstName, lastName, password } = req.body;

  try {
    const record = await prisma.oTPAuth.findFirst({
      where: { email, otp },
      orderBy: { createdAt: 'desc' }
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Find or create candidate
    let user = await prisma.user.findFirst({
      where: { email },
      include: { userRoles: { include: { role: true } } }
    });

    if (!user) {
      // Create user. Wait, User requires tenantId! 
      // For candidates, we can assign them to a default tenant or we need to know which tenant they are applying to.
      // Usually candidates are global or tied to the organization they apply to. 
      // Let's find the first tenant for now (assuming single tenant environment for this demo Phase 0)
      const defaultTenant = await prisma.tenant.findFirst();
      
      let candidateRole = await prisma.role.findFirst({ where: { slug: 'candidate' } });
      if (!candidateRole) {
        candidateRole = await prisma.role.create({
          data: {
            name: 'Candidate',
            slug: 'candidate',
            tenantId: defaultTenant!.id
          }
        });
      }

      user = await prisma.user.create({
        data: {
          email,
          firstName: firstName || 'Candidate',
          lastName: lastName || '',
          passwordHash: password ? await bcrypt.hash(password, 10) : 'otp-auth',
          tenantId: defaultTenant!.id,
          userRoles: {
            create: {
              roleId: candidateRole.id,
              tenantId: defaultTenant!.id
            }
          }
        },
        include: { userRoles: { include: { role: true } } }
      });
    } else if (password && user.passwordHash === 'otp-auth') {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
        include: { userRoles: { include: { role: true } } }
      });
    }

    // Clean up OTP
    await prisma.oTPAuth.deleteMany({ where: { email } });

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, roles: user.userRoles.map(ur => ur.role.slug) },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    logger.error('Verify OTP error', { error });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login with Email & Password
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: { userRoles: { include: { role: true } } }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.passwordHash === 'otp-auth') {
      return res.status(400).json({ success: false, message: 'Please use Sign Up to set a password for your account' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, roles: user.userRoles.map(ur => ur.role.slug) },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── SUBMIT APPLICATION ─────────────────────

router.post('/jobs/:jobId/apply', async (req, res) => {
  const { jobId } = req.params;
  const { candidateId, coverLetter, resumeUrl } = req.body;

  try {
    const job = await prisma.jobPosting.findUnique({ 
      where: { id: jobId }
    });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const tenant = await prisma.tenant.findUnique({ where: { id: job.tenantId } });
    const tenantName = tenant ? tenant.name : 'Company';

    const user = await prisma.user.findUnique({ where: { id: candidateId } });
    if (!user) return res.status(404).json({ success: false, message: 'Candidate not found' });

    // Check if already applied
    const existing = await prisma.jobApplication.findFirst({
      where: { jobId, candidateId }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this position' });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        candidateId,
        tenantId: job.tenantId,
        coverLetter,
        resumeUrl,
        stage: 'APPLIED'
      }
    });

    // Send confirmation email asynchronously
    sendApplicationConfirmationEmail(user.email, user.firstName, job.title, tenantName).catch(e => {
      logger.error('Failed to send application confirmation email inside route', { error: e });
    });

    res.json({ success: true, data: application });
  } catch (error) {
    logger.error('Apply job error', { error });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── CANDIDATE DASHBOARD ────────────────────

router.get('/candidate/applications', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
    const applications = await prisma.jobApplication.findMany({
      where: { candidateId: decoded.id },
      include: { 
        job: true
      },
      orderBy: { appliedAt: 'desc' }
    });
    
    // Attach tenant names manually
    const tenantIds = [...new Set(applications.map(a => a.job.tenantId))];
    const tenants = await prisma.tenant.findMany({ where: { id: { in: tenantIds } } });
    const tenantMap = new Map(tenants.map(t => [t.id, t]));

    const applicationsWithTenant = applications.map(app => ({
      ...app,
      job: {
        ...app.job,
        tenant: tenantMap.get(app.job.tenantId)
      }
    }));

    res.json({ success: true, data: applicationsWithTenant });
  } catch (error) {
    logger.error('Get candidate applications error', { error });
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

export default router;
