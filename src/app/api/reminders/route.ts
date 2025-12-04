
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
    subject: "🌅 Morning DSA Trigger",
    body: "Start your day with 45 minutes of DSA. No shorts. No scrolling.",
  },
  noonDSAReminder: {
    subject: "☀️ Noon Study Check-in",
    body: "Have you revised anything yet today? Open CodeNote and do one problem.",
  },
  eveningDSAReminder: {
    subject: "🌆 Evening Revision",
    body: "Do a small revision session. Even 20 minutes boosts retention.",
  },
  nightDSAReminder: {
    subject: "🌙 Night Practice",
    body: "Write at least one DSA practice solution before sleep.",
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
