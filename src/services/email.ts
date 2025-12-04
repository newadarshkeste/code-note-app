
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.warn("SendGrid API key not found. Email sending will be disabled.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  body: string; // Body is expected to be HTML
}

export const sendEmail = async ({ to, subject, body }: EmailParams) => {
  if (!SENDGRID_API_KEY) {
    throw new Error("SendGrid is not configured. Cannot send email.");
  }

  // A simple function to strip HTML for the plain text version
  const createPlainText = (html: string) => {
    return html
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<b>/g, '')
      .replace(/<\/b>/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  const msg = {
    to: to,
    from: 'adarshkeste.job2025@gmail.com',
    subject: subject,
    text: createPlainText(body), // Generate a plain text version
    html: body, // Use the HTML body directly
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error(error.response.body)
    }
    return { success: false, error: 'Failed to send email.' };
  }
};
