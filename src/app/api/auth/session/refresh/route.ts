import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { refreshSession } from "@/lib/session";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { message: "No session found" },
        { status: 401 },
      );
    }

    const session = await refreshSession(sessionId);

    if (!session) {
      cookieStore.delete("sessionId");

      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    cookieStore.set("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });

    return NextResponse.json({
      message: "Session refreshed",
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
