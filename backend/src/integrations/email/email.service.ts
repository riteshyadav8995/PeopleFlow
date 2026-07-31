import { logger } from '../../shared/logger/logger';

export class EmailService {
  async sendEmail(to: string, subject: string, html: string) {
    try {
      let apiKey = process.env.BREVO_API_KEY;
      const fromEmail = process.env.SMTP_FROM_EMAIL;

      if (!apiKey && process.env.BREVO_MCP_API_KEY) {
        try {
          const decoded = Buffer.from(process.env.BREVO_MCP_API_KEY, 'base64').toString();
          apiKey = JSON.parse(decoded).api_key;
        } catch (e) {
          logger.error('Failed to parse BREVO_MCP_API_KEY', { error: e });
        }
      }

      if (!apiKey) {
        logger.error('BREVO_API_KEY is not defined in environment variables');
        return false;
      }

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: 'PeopleFlow',
            email: fromEmail || 'no-reply@peopleflow.local',
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error(`Brevo API error: ${response.status} ${errorData}`);
        return false;
      }

      const data: any = await response.json();
      logger.info(`Email sent via Brevo API to ${to}: ${data.messageId || 'Success'}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email via Brevo API', { error });
      return false;
    }
  }
}

export const emailService = new EmailService();
