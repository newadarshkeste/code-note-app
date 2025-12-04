'use server';

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/services/email";

// Check for the secret key from environment variables
const CRON_SECRET = process.env.CRON_SECRET;

const reminderDetails: Record<string, { subject: string; body: string }> = {
  morning: {
    subject: "Morning Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for the morning.</p>
      <p><b>Today's task:</b> Practice DSA for 45 minutes.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
  noon: {
    subject: "Noon Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for noon.</p>
      <p><b>Today's task:</b> Review a DSA concept or problem.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
  evening: {
    subject: "Evening Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for the evening.</p>
      <p><b>Today's task:</b> Complete a 20-minute revision session.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
  night: {
    subject: "Night Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for the night.</p>
      <p><b>Today's task:</b> Solve one last problem before sleep.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
  // Keep the more descriptive ones in case they are used elsewhere, but the cron jobs will use the simple ones.
  morningDSAReminder: {
    subject: "Morning Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for the morning.</p>
      <p><b>Today's task:</b> Practice DSA for 45 minutes.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
  noonDSAReminder: {
    subject: "Noon Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for noon.</p>
      <p><b>Today's task:</b> Review a DSA concept or problem.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
  eveningDSAReminder: {
    subject: "Evening Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for the evening.</p>
      <p><b>Today's task:</b> Complete a 20-minute revision session.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
  nightDSAReminder: {
    subject: "Night Study Reminder",
    body: `
      <p>Hi Adarsh,</p>
      <p>This is your scheduled study reminder for the night.</p>
      <p><b>Today's task:</b> Solve one last problem before sleep.</p>
      <p>If you're already done, you can ignore this message.</p>
      <p>— CodeNote System</p>
    `,
  },
};

const TARGET_EMAIL = "adarshkeste.yt@gmail.com";

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

  const details = reminderDetails[type];
  const result = await sendEmail({
    to: TARGET_EMAIL,
    subject: details.subject,
    body: details.body,
  });

  return NextResponse.json({
    success: true,
    message: `GET reminder (${type}) sent to ${TARGET_EMAIL}`,
    result,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");

    // Validate the secret key for POST requests as well
    if (!CRON_SECRET || secret !== CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const type = data.reminderType;
    
    if (!type || !reminderDetails[type]) {
      return NextResponse.json(
        { error: "Invalid reminder type" },
        { status: 400 }
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
      message: `POST reminder (${type}) sent to ${TARGET_EMAIL}`,
      result,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
