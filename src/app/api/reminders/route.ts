'use server';

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/services/email";

// Check for the secret key from environment variables
const CRON_SECRET = process.env.CRON_SECRET;

const reminderDetails: Record<string, { subject: string; body: string }> = {
  morning: {
    subject: "Morning Study Reminder",
    body: `
      <p>Hi there,</p>
      <p>This is your scheduled study reminder for the morning.</p>
      <p><b>Today's goal:</b> Spend at least one focus session on your main topic.</p>
      <p>Keep up the great work!</p>
      <p>— CodeNote System</p>
    `,
  },
  evening: {
    subject: "Evening Study Reminder",
    body: `
      <p>Hi there,</p>
      <p>This is your scheduled study reminder for the evening.</p>
      <p><b>Today's goal:</b> Complete a 20-minute revision session on what you learned today.</p>
      <p>Consistency is key. Let's finish the day strong!</p>
      <p>— CodeNote System</p>
    `,
  },
};

const TARGET_EMAIL = process.env.REMINDER_EMAIL || "test@example.com";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const secret = searchParams.get("secret");

  // Validate the secret key
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!type || !reminderDetails[type]) {
    return NextResponse.json(
      { error: "Invalid or missing reminder type" },
      { status: 400 }
    );
  }

  if (!process.env.REMINDER_EMAIL) {
     return NextResponse.json(
      { error: "Reminder target email not set in environment variables." },
      { status: 500 }
    );
  }

  const details = reminderDetails[type];
  const result = await sendEmail({
    to: TARGET_EMAIL,
    subject: details.subject,
    body: details.body,
  });

  return NextResponse.json({
    success: true,
    message: `Reminder (${type}) sent to ${TARGET_EMAIL}`,
    result,
  });
}
