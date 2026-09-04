import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { transporter } from "@/lib/mailer";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 },
      );
    }
    const now = Date.now();

    if (
      user.lastVerificationEmailSentAt &&
      now - user.lastVerificationEmailSentAt.getTime() < 60 * 1000
    ) {
      return NextResponse.json(
        { message: "Please wait 60 seconds before requesting another email" },
        { status: 429 },
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;

    await user.save();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Verify Your Email</h2>
        <p>Hello ${user.name},</p>
        <p>Click the button below to verify your email:</p>

        <a
          href="${process.env.APP_URL}/verify-email?token=${verificationToken}"
          style="
            display: inline-block;
            padding: 10px 20px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
          "
        >
          Verify Email
        </a>

        <p>This link will expire in 10 minutes.</p>
      `,
    });

    user.lastVerificationEmailSentAt = new Date();
    await user.save();

    return NextResponse.json({
      message: "Verification email sent",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
