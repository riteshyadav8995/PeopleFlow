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
