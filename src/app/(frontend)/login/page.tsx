"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendEmail, setResendEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginData) {
    try {
      setIsLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message);

        if (res.status === 403) {
          setResendEmail(data.email);
          setShowResend(true);
        }

        return;
      }

      toast.success(result.message);

      if (result.user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/profile");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function resendVerificationEmail() {
    try {
      setResending(true);

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resendEmail }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setCooldown(60);

      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lg sm:p-9">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Login to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>

            <input
              {...register("email")}
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>

            <input
              {...register("password")}
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />

            {errors.password && (
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => router.replace("/forgot-password")}
              className="cursor-pointer text-sm font-medium text-orange-500 hover:text-orange-600"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 w-full rounded-lg bg-orange-500 px-4 py-2.5 font-medium text-white transition hover:bg-orange-600 active:scale-[0.99]"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <p className="mt-5 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => router.replace("/signup")}
              className="cursor-pointer font-medium text-orange-500 hover:text-orange-600"
            >
              Sign up
            </button>
          </p>
        </form>

        {showResend && (
          <div className="mt-5 text-center">
            <button
              type="button"
              disabled={resending || cooldown > 0}
              onClick={resendVerificationEmail}
              className="cursor-pointer text-sm font-medium text-orange-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend available in ${cooldown}s`
                  : "Resend Verification Email"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
