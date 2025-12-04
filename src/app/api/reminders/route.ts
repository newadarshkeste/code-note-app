
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/services/email';
import { z } from 'zod';

const ReminderRequestSchema = z.object({
  reminderType: z.enum([
    'morningDSAReminder',
    'noonDSAReminder',
    'eveningDSAReminder',
    'nightDSAReminder',
  ]),
});

const reminderDetails = {
  morningDSAReminder: {
    subject: "🌅 Your Morning DSA Trigger from CodeNote",
    body: `
      <p>Hello Adarsh,</p>
      <p>Time to kickstart your day with some problem-solving!</p>
      <p><b>Your goal:</b> 45 minutes of focused Data Structures & Algorithms practice. Remember, no distractions, no shorts, no scrolling.</p>
      <p>Let's make today count!</p>
      <p>Best,<br/>The CodeNote Assistant</p>
    `,
  },
  noonDSAReminder: {
    subject: "☀️ Quick Noon Study Check-in",
    body: `
      <p>Hi Adarsh,</p>
      <p>Just a friendly check-in. Have you had a chance to revise anything yet today?</p>
      <p>Even one problem on CodeNote can make a big difference. Keep the momentum going!</p>
      <p>Cheers,<br/>The CodeNote Assistant</p>
    `,
  },
  eveningDSAReminder: {
    subject: "🌆 Time for an Evening Revision",
    body: `
      <p>Good evening Adarsh,</p>
      <p>How about a quick revision session to solidify what you've learned?</p>
      <p>Even 20 minutes of review can significantly boost your retention. Let's lock in that knowledge!</p>
      <p>Keep it up,<br/>The CodeNote Assistant</p>
    `,
  },
  nightDSAReminder: {
    subject: "🌙 One Last Practice for the Night",
    body: `
      <p>Hey Adarsh,</p>
      <p>Before you wrap up your day, try to solve at least one DSA problem.</p>
      <p>It's a powerful way to end the day and reinforces your learning right before sleep.</p>
      <p>Happy coding,<br/>The CodeNote Assistant</p>
    `,
  },
};

const TARGET_EMAIL = 'adarshkeste.yt@gmail.com';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = ReminderRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid reminder type provided.' }, { status: 400 });
    }

    const { reminderType } = parsed.data;
    const details = reminderDetails[reminderType];

    const result = await sendEmail({
      to: TARGET_EMAIL,
      subject: details.subject,
      body: details.body,
    });

    if (result.success) {
      return NextResponse.json({ message: `Successfully sent ${reminderType} to ${TARGET_EMAIL}` });
    } else {
      return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
    }

  } catch (error) {
    console.error('API Reminders Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
