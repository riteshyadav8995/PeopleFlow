import { logger } from '../logger/logger';
import { env } from '../../config/env.validation';

export const emailUtil = {
  async sendActivationEmail(to: string, activationUrl: string, orgName?: string, roleName?: string) {
    let apiKey = env.BREVO_API_KEY || process.env.BREVO_API_KEY;
    
    if (!apiKey && (env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY)) {
      try {
        const decoded = Buffer.from((env.BREVO_MCP_API_KEY || process.env.BREVO_MCP_API_KEY) as string, 'base64').toString();
        apiKey = JSON.parse(decoded).api_key;
      } catch (e) {
        logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
      }
    }

    if (!apiKey) {
      logger.info('====================================================');
      logger.info('📧 EMAIL SIMULATION (API Key Missing)');
      logger.info('====================================================');
      logger.info(`To: ${to}`);
      logger.info('Subject: Welcome to PeopleFlow - Activate Your Account');
      logger.info(`🔗 Activation Link: ${activationUrl}`);
      logger.info('====================================================');
      return;
    }

    try {
      let greetingBody = `<p>You have been invited to manage your organization on PeopleFlow.</p>`;
      if (orgName && roleName) {
        greetingBody = `
          <p><strong>Company:</strong> ${orgName}</p>
          <p><strong>Role:</strong> ${roleName}</p>
        `;
      }

      const senderEmail = env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@peopleflow.com';

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
          subject: 'Welcome to PeopleFlow - Activate Your Account',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Welcome to PeopleFlow!</h2>
              <p>Hello,</p>
              ${greetingBody}
              <p>Please click the button below to set your password and activate your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Activate Account</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p><a href="${activationUrl}">${activationUrl}</a></p>
              <p>This link will expire in 3 days.</p>
              <br/>
              <p>Best regards,<br/>The PeopleFlow Team</p>
            </div>
          `
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to send activation email via Brevo API:', { status: response.status, errorText });
      } else {
        logger.info(`📧 Activation email sent to ${to} via Brevo API`);
      }
    } catch (error: any) {
      logger.error('Failed to send activation email via Brevo API:', { error: error.message || error });
    }
  }
};
