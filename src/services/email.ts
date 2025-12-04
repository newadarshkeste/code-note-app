
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
  body: string;
}

export const sendEmail = async ({ to, subject, body }: EmailParams) => {
  if (!SENDGRID_API_KEY) {
    throw new Error("SendGrid is not configured. Cannot send email.");
  }

  const msg = {
    to: to,
    from: 'reminders@codenote.app', // You must verify this sender address in SendGrid
    subject: subject,
    text: body,
    html: `<p>${body}</p>`,
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
