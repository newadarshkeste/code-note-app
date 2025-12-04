'use server';

import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/services/email";

// Check for the secret key from environment variables
const CRON_SECRET = process.env.CRON_SECRET;

const reminderDetails: Record<string, { subject: string; body: string }> = {
  morning: {
    subject: "🌅 Your Morning DSA Trigger from CodeNote",
    body: `
      <p>Hello Adarsh,</p>
      <p>Time to kickstart your day with some problem-solving!</p>
      <p><b>Your goal:</b> 45 minutes of focused DSA. No shorts. No scrolling.</p>
      <p>Let's make today count!</p>
    `,
  },
  noon: {
    subject: "☀️ Quick Noon Study Check-in",
    body: `
      <p>Hi Adarsh,</p>
      <p>Have you revised anything yet today?</p>
      <p>Even one problem makes a difference.</p>
    `,
  },
  evening: {
    subject: "🌆 Time for an Evening Revision",
    body: `
      <p>Good evening Adarsh,</p>
      <p>Try 20 minutes of revision before relaxing.</p>
    `,
  },
  night: {
    subject: "🌙 One Last Practice for the Night",
    body: `
      <p>Hey Adarsh,</p>
      <p>One DSA problem before sleep boosts long-term memory.</p>
    `,
  },
  morningDSAReminder: {
    subject: "🌅 Rise and Code, Adarsh! Your Daily DSA Challenge Awaits",
    body: `
      <p>Good morning Adarsh,</p>
      <p>A new day is a new opportunity to sharpen your skills. Your personal CodeNote assistant is here to help you get started.</p>
      <p><b>Today's Focus:</b> 45 minutes of dedicated Data Structures & Algorithms practice. Remember, consistency is key to mastery.</p>
      <p>You can do it!</p>
      <p>Best,<br/>The CodeNote Assistant</p>
      <hr style="border:none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">Sent from your <a href="https://code-note-app.onrender.com/" style="color: #999;">CodeNote App</a>.</p>
    `,
  },
  noonDSAReminder: {
    subject: "☀️ Adarsh, How's Your Study Streak Going?",
    body: `
      <p>Hi Adarsh,</p>
      <p>Just a friendly check-in from your CodeNote assistant. Have you had a chance to tackle a problem today?</p>
      <p>Even a quick 15-minute review can make a huge difference in your learning. Don't break the chain!</p>
      <p>Keep up the great work,</p>
      <p>Cheers,<br/>The CodeNote Assistant</p>
      <hr style="border:none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">This reminder was sent from your <a href="https://code-note-app.onrender.com/" style="color: #999;">CodeNote App</a>.</p>
    `,
  },
  eveningDSAReminder: {
    subject: "🌆 Evening Revision Session with CodeNote",
    body: `
      <p>Good evening Adarsh,</p>
      <p>The day is winding down, which makes it a perfect time to solidify what you've learned. How about a quick revision session?</p>
      <p>Reviewing a concept or re-doing a problem for just 20 minutes can significantly boost retention. Let's lock in that knowledge!</p>
      <p>Keep it up,</p>
      <p>Your CodeNote Assistant</p>
      <hr style="border:none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">Sent via the reminder service in your <a href="https://code-note-app.onrender.com/" style="color: #999;">CodeNote App</a>.</p>
    `,
  },
  nightDSAReminder: {
    subject: "🌙 One Last Problem Before You Rest, Adarsh?",
    body: `
      <p>Hey Adarsh,</p>
      <p>As you get ready to wrap up your day, consider solving one more problem. It's a powerful way to reinforce learning right before sleep, helping your brain process the information overnight.</p>
      <p>End the day on a high note!</p>
      <p>Happy coding,</p>
      <p>The CodeNote Assistant</p>
      <hr style="border:none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">This is a scheduled reminder from your <a href="https://code-note-app.onrender.com/" style="color: #999;">CodeNote App</a>.</p>
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
    const data = await req.json();
    const type = data.reminderType;
    
    // The secret should be part of the POST body for consistency, but for this use case,
    // we'll stick to making GET requests public with a secret.
    // POST requests will remain as they were but won't be used by cron-job.org.
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
