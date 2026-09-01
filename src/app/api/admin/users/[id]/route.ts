import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { role } = await request.json();

    if (!["user", "admin"].includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const currentUserId = await getUserFromSession(sessionId);

    if (!currentUserId) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { message: "Only admins can manage users" },
        { status: 403 },
      );
    }
    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUserId === user._id.toString()) {
      return NextResponse.json(
        { message: "You cannot change your own role" },
        { status: 403 },
      );
    }

    if (user.email === process.env.MAIN_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Main admin role cannot be changed" },
        { status: 403 },
      );
    }

    user.role = role;
    await user.save();

    return NextResponse.json({
      message: "Role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 },
      );
    }

    const currentUserId = await getUserFromSession(sessionId);

    if (!currentUserId) {
      return NextResponse.json({ message: "Session expired" }, { status: 401 });
    }
    await connectDB();
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json(
        { message: "Only admins can delete users" },
        { status: 403 },
      );
    }
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user._id.toString() === currentUserId) {
      return NextResponse.json(
        { message: "You cannot delete your own account" },
        { status: 403 },
      );
    }
    
    if (user.email === process.env.MAIN_ADMIN_EMAIL) {
      return NextResponse.json(
        { message: "Main admin cannot be deleted" },
        { status: 403 },
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
