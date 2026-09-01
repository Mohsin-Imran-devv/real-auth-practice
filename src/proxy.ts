import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { User } from "@/models/User";
import { connectDB } from "@/lib/db";

export async function proxy(request: NextRequest) {
  const sessionId = request.cookies.get("sessionId")?.value;

  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup"
  ) {
    if (sessionId) {
      const session = await getSession(sessionId);

      if (session) {
        const user = await User.findById(session.userId);

        if (user?.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }

        return NextResponse.redirect(new URL("/profile", request.url));
      }
    }

    return NextResponse.next();
  }

  if (!sessionId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const session = await getSession(sessionId);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await connectDB();

  const user = await User.findById(session.userId);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/profile", "/admin/:path*"],
};
