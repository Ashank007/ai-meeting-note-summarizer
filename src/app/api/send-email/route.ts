import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { marked } from "marked";

export async function POST(req: Request) {
  try {
    const { recipients, subject, body } = await req.json();

    if (!recipients?.length || !body) {
      return NextResponse.json(
        { error: "Recipients and summary are required" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // 👇 Convert markdown (##, *, etc.) into HTML
    const htmlBody = marked.parse(body);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipients,
      subject: subject || "Meeting Summary",
      html: htmlBody, // send HTML instead of plain text
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


