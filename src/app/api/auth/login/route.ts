import { connectDB } from "@/lib/db";
import { createSession } from "@/lib/session";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LoginAttempt } from "@/models/LoginAttempt";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const data = await request.json();
    const result = loginSchema.safeParse(data);

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    await connectDB();
    const ipRecord = await LoginAttempt.findOne({ ip });
    if (ipRecord?.blockedUntil) {
      if (ipRecord.blockedUntil > new Date()) {
        const remainingSeconds = Math.ceil(
          (ipRecord.blockedUntil.getTime() - Date.now()) / 1000,
        );

        return NextResponse.json(
          {
            message: "Too many login attempts from this IP. Try again later.",
            remainingSeconds,
          },
          { status: 429 },
        );
      }

      ipRecord.blockedUntil = null;
      ipRecord.attempts = 0;
      await ipRecord.save();
    }
    const user = await User.findOne({
      email: result.data.email,
    });

    if (!user) {
      return NextResponse.json({ message: "Invalid email" }, { status: 401 });
    }

    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        const remainingSeconds = Math.ceil(
          (user.lockedUntil.getTime() - Date.now()) / 1000,
        );
        return NextResponse.json(
          {
            message: "Too many failed attempts. Try again later.",
            remainingSeconds,
          },
          { status: 429 },
        );
      }
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
      await user.save();
    }

    const passwordMatch = await bcrypt.compare(
      result.data.password,
      user.password,
    );

    if (!passwordMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      }

      if (ipRecord) {
        ipRecord.attempts += 1;

        if (ipRecord.attempts >= 20) {
          ipRecord.blockedUntil = new Date(Date.now() + 10 * 60 * 1000);
        }

        await ipRecord.save();
      } else {
        await LoginAttempt.create({
          ip,
          attempts: 1,
        });
      }

      await user.save();
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 },
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { message: "Please verify your email first" },
        { status: 403 },
      );
    }
    if (ipRecord) {
      ipRecord.attempts = 0;
      ipRecord.blockedUntil = null;
      await ipRecord.save();
    }
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    const sessionId = await createSession(user._id.toString());

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      },
      { status: 200 },
    );
    response.cookies.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
