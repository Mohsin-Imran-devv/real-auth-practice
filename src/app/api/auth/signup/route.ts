import cloudinary from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { signupServerSchema } from "@/lib/validations";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { transporter } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { message: "Image is required" },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { message: "Only JPG, PNG, and WebP images are allowed" },
        { status: 400 },
      );
    }

    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Image must be less than 5MB" },
        { status: 400 },
      );
    }

    const result = signupServerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

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
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadResult = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "real-auth-practice",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result as { secure_url: string });
              }
            },
          )
          .end(buffer);
      },
    );

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.create({
      name,
      email,
      password: hashedPassword,
      image: uploadResult.secure_url,
      verificationToken,
      verificationTokenExpiry,
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      html: `
    <h2>Welcome, ${name}!</h2>
    <p>Please click the button below to verify your email:</p>

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
    return NextResponse.json(
      { message: "Signup successful. Please verify your email." },
      { status: 201 },
    );
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
