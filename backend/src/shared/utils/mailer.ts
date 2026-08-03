import { env } from '../../config/env.validation';
import { logger } from '../logger/logger';

export const sendOTP = async (to: string, otp: string) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] Sending OTP ${otp} to ${to}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'PeopleFlow Candidate Portal' },
        to: [{ email: to }],
        subject: 'Your Candidate Verification Code',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email</h2>
            <p style="color: #475569; font-size: 16px;">Please use the following OTP to complete your registration or login process:</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to send OTP email via Brevo API', { status: response.status, errorText });
      return false;
    }

    logger.info(`OTP email sent to ${to} via Brevo API`);
    return true;
  } catch (error) {
    logger.error('Failed to send OTP email', { error, to });
    return false;
  }
};

export const sendApplicationConfirmationEmail = async (to: string, candidateName: string, jobTitle: string, company: string) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] Application Confirmation to ${to}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: company },
        to: [{ email: to }],
        subject: `Application Received: ${jobTitle}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Application Received</h2>
            <p style="color: #475569; font-size: 16px;">Hi ${candidateName},</p>
            <p style="color: #475569; font-size: 16px;">Thank you for applying for the <strong>${jobTitle}</strong> position at <strong>${company}</strong>.</p>
            <p style="color: #475569; font-size: 16px;">We have received your application successfully and our team will review it shortly. You can track your application status in your Candidate Dashboard.</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Best regards,<br/>The ${company} Hiring Team</p>
          </div>
        `
      })
    });
    return response.ok;
  } catch (error) {
    logger.error('Failed to send application confirmation email', { error, to });
    return false;
  }
};

export const sendApplicationStageEmail = async (to: string, candidateName: string, jobTitle: string, stage: string, company: string) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] Stage Update to ${to}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: company },
        to: [{ email: to }],
        subject: `Update on your application: ${jobTitle}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Application Status Update</h2>
            <p style="color: #475569; font-size: 16px;">Hi ${candidateName},</p>
            <p style="color: #475569; font-size: 16px;">We wanted to let you know that your application for the <strong>${jobTitle}</strong> position has been moved to the following stage:</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <span style="font-size: 20px; font-weight: bold; color: #0ea5e9;">${stage}</span>
            </div>
            <p style="color: #475569; font-size: 16px;">We will keep you informed of any further updates. You can also view this in your Candidate Dashboard.</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Best regards,<br/>The ${company} Hiring Team</p>
          </div>
        `
      })
    });
    return response.ok;
  } catch (error) {
    logger.error('Failed to send stage update email', { error, to });
    return false;
  }
};

export const sendPayslipNotification = async (to: string, employeeName: string, month: string, year: string, company: string, netPay: number) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] Payslip Notification to ${to}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: company },
        to: [{ email: to }],
        subject: `Your ${month} ${year} Payslip is Ready`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Payslip Generated</h2>
            <p style="color: #475569; font-size: 16px;">Hi ${employeeName},</p>
            <p style="color: #475569; font-size: 16px;">Your salary for <strong>${month} ${year}</strong> has been processed by <strong>${company}</strong>.</p>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <span style="font-size: 16px; color: #475569;">Net Pay:</span><br/>
              <span style="font-size: 24px; font-weight: bold; color: #10b981;">₹${netPay.toLocaleString('en-IN')}</span>
            </div>
            <p style="color: #475569; font-size: 16px;">You can log in to your employee portal to view and download your full payslip.</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Best regards,<br/>The ${company} Payroll Team</p>
          </div>
        `
      })
    });
    return response.ok;
  } catch (error) {
    logger.error('Failed to send payslip notification email', { error, to });
    return false;
  }
};

export const sendOrganizationReportEmail = async (to: string, userName: string, stats: any) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] Organization Report Email to ${to}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'PeopleFlow Platform' },
        to: [{ email: to }],
        subject: 'Your Organization Daily Report',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Daily Organization Report</h2>
            <p style="color: #475569; font-size: 16px;">Hi ${userName},</p>
            <p style="color: #475569; font-size: 16px;">Here is the latest snapshot of your organization's key metrics:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: bold;">Total Staff</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right;">${stats.totalStaff}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: bold;">Present Today</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right;">${stats.presentToday}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: bold;">On Leave</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right;">${stats.onLeave}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: bold;">Pending Approvals</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right;">${stats.pendingApprovals}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: bold;">Active Projects</td>
                <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; text-align: right;">${stats.activeProjects}</td>
              </tr>
              <tr>
                <td style="padding: 12px; color: #475569; font-weight: bold;">Overdue Tasks</td>
                <td style="padding: 12px; color: #e11d48; font-weight: bold; text-align: right;">${stats.overdueTasks}</td>
              </tr>
            </table>

            <p style="color: #475569; font-size: 16px;">Log in to your PeopleFlow dashboard for more detailed insights.</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Best regards,<br/>The PeopleFlow Team</p>
          </div>
        `
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to send organization report email via Brevo API', { status: response.status, errorText });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Failed to send organization report email', { error, to });
    return false;
  }
};

export const sendPasswordResetEmail = async (to: string, resetUrl: string) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] Password Reset Email to ${to} with URL ${resetUrl}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'PeopleFlow' },
        to: [{ email: to }],
        subject: 'Password Reset Request',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #475569; font-size: 16px;">We received a request to reset your password for your PeopleFlow account.</p>
            <div style="margin: 32px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">Best regards,<br/>The PeopleFlow Team</p>
          </div>
        `
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to send password reset email via Brevo API', { status: response.status, errorText });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { error, to });
    return false;
  }
};

export const sendOnboardingWelcomeEmail = async (
  to: string,
  employeeName: string,
  templateName: string,
  tasks: { title: string; category: string; dueDate: Date }[],
  dashboardUrl: string
) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] Onboarding Welcome Email to ${to} (${employeeName})`);
    return true;
  }

  const taskRows = tasks.map(t => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 14px;">${t.title}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; text-align: center;">${t.category}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px; text-align: center;">${new Date(t.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
    </tr>
  `).join('');

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'PeopleFlow HR' },
        to: [{ email: to }],
        subject: `🚀 Your Onboarding Journey Has Begun – Welcome Aboard!`,
        htmlContent: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 36px 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 26px; font-weight: 700;">Welcome to the Team, ${employeeName}! 🎉</h1>
              <p style="color: #c7d2fe; margin: 0; font-size: 15px;">Your onboarding journey has officially started.</p>
            </div>

            <!-- Body -->
            <div style="padding: 32px;">
              <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0;">
                We're thrilled to have you on board. Your onboarding plan <strong>"${templateName}"</strong> has been created and is ready for you.
                Below are the tasks assigned to you as part of your first steps:
              </p>

              <!-- Task Table -->
              <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 10px 12px; text-align: left; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Task</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Assigned To</th>
                    <th style="padding: 10px 12px; text-align: center; font-size: 13px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${taskRows}
                </tbody>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 28px 0 16px;">
                <a href="${dashboardUrl}" style="background-color: #4f46e5; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                  View My Onboarding Dashboard →
                </a>
              </div>

              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-bottom: 0;">
                If you have any questions, reach out to your HR team. We're here to help!
              </p>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PeopleFlow. All rights reserved.</p>
            </div>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to send onboarding welcome email via Brevo API', { status: response.status, errorText });
      return false;
    }
    logger.info(`Onboarding welcome email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send onboarding welcome email', { error, to });
    return false;
  }
};

export const sendInterviewScheduledByAIEmail = async (
  to: string,
  candidateName: string,
  jobTitle: string,
  scheduledTime: string
) => {
  let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
  if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
    try {
      const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
      apiKey = JSON.parse(decoded).api_key;
    } catch (e) {
      logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
    }
  }
  const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

  if (!apiKey) {
    logger.warn(`[MAIL_MOCK] AI Interview Scheduled Email to Admin ${to} for candidate ${candidateName}`);
    return true;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey as string
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'PeopleFlow AI Agent' },
        to: [{ email: to }],
        subject: `🤖 AI Action: Interview Scheduled for ${candidateName}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e293b; margin-top: 0;">AI Agent Action Summary</h2>
            <p style="color: #475569; font-size: 16px;">Hello Admin,</p>
            <p style="color: #475569; font-size: 16px;">Your AI Calling Agent has successfully completed a phone screening with <strong>${candidateName}</strong> for the <strong>${jobTitle}</strong> position.</p>
            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 24px 0;">
              <p style="margin: 0; color: #334155;"><strong>Status:</strong> Suitable - Interview Scheduled</p>
              <p style="margin: 8px 0 0 0; color: #334155;"><strong>Tentative Date:</strong> ${scheduledTime}</p>
            </div>
            <p style="color: #475569; font-size: 16px;">Please log in to the PeopleFlow dashboard to review the transcript and send the final confirmation email with the meeting link to the candidate and interviewer.</p>
          </div>
        `
      })
    });
    return response.ok;
  } catch (error) {
    logger.error('Failed to send AI interview scheduled email', { error, to });
    return false;
  }
};

