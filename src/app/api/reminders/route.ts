import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/services/email";

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

const TARGET_EMAIL = "adarshkeste.yt@gmail.com";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

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
