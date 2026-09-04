import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({
      verificationToken: token,
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid verification token" },
        { status: 400 },
      );
    }

    if (user.isVerified) {
      return NextResponse.json({
        message: "Email already verified",
      });
    }

    if (user.verificationTokenExpiry < new Date()) {
      return NextResponse.json(
        { message: "Verification token has expired" },
        { status: 400 },
      );
    }

    user.isVerified = true;
    user.verificationTokenExpiry = null;

    await user.save();

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
