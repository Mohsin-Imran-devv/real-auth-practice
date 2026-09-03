import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user || !user.resetOtp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    if (user.resetOtpExpiry < new Date()) {
      return NextResponse.json({ message: "OTP has expired" }, { status: 400 });
    }

    if (user.resetOtpAttempts >= 5) {
      return NextResponse.json(
        { message: "Too many attempts. Please request a new OTP." },
        { status: 429 },
      );
    }

    if (user.resetOtp !== otp) {
      user.resetOtpAttempts += 1;
      await user.save();

      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // OTP verified
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.resetOtpAttempts = 0;

    // Generate reset token for the next step
    const resetToken = crypto.randomUUID();

    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    return NextResponse.json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
