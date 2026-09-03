"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otpExpired, setOtpExpired] = useState(false);
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function resendOtp() {
    if (!email) {
      toast.error("Email is missing");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message);
        return;
      }

      setOtp("");
      setOtpExpired(false);

      toast.success("New OTP sent to your email");
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      toast.error("Email is missing");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setOtpExpired(true);
        }

        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      router.replace(`/reset-password?token=${result.resetToken}`);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-lg sm:p-9">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter the 6-digit OTP sent to your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg tracking-[6px] outline-none focus:border-orange-500"
          />

          <button
            type={otpExpired ? "button" : "submit"}
            onClick={otpExpired ? resendOtp : undefined}
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading
              ? otpExpired
                ? "Sending..."
                : "Verifying..."
              : otpExpired
                ? "Resend OTP"
                : "Verify OTP"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function VerifyOtp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
