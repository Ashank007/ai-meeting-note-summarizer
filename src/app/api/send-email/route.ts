import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { marked } from "marked";

interface SendEmailRequest {
  recipients: string[];
  subject: string;
  body: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SendEmailRequest = await req.json();

    if (!body.recipients?.length || !body.body) {
      return NextResponse.json({ error: "Recipients and body are required" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

   const htmlBody: string = marked.parse(body.body).toString();

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: body.recipients.join(", "),
      subject: body.subject,
      text: body.body,
      html: htmlBody, 
    });

    return NextResponse.json({ message: "Email sent" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error sending email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


