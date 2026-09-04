import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import { transporter } from "@/lib/mailer";

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

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Please verify your email first" },
        { status: 403 },
      );
    }

    const now = Date.now();

    if (
      user.lastResetOtpSentAt &&
      now - user.lastResetOtpSentAt.getTime() < 60 * 1000
    ) {
      return NextResponse.json(
        { message: "Please wait 60 seconds before requesting another OTP" },
        { status: 429 },
      );
    }

    // Generate 6-digit OTP
    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP for 10 minutes
    user.resetOtp = resetOtp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Password Reset OTP",
      html: `
        <h2>Password Reset OTP</h2>
        <p>Your OTP for resetting your password is:</p>
        <h1>${resetOtp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      `,
    });
    user.lastResetOtpSentAt = new Date();
    await user.save();

    return NextResponse.json({
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
