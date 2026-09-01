import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { Session } from "@/models/Session";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { message: "Already logged out" },
        { status: 401 },
      );
    }

    await Session.deleteOne({ sessionId });

    cookieStore.delete("sessionId");

    return NextResponse.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
