import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    await connectDB();

    const users = await User.find({}).select("-password");

    const usersWithMainAdmin = users.map((user) => ({
      ...user.toObject(),
      isMainAdmin: user.email === process.env.MAIN_ADMIN_EMAIL,
    }));

    return NextResponse.json({ users: usersWithMainAdmin });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
