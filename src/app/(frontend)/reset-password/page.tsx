"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setTimeout(() => {
        router.replace("/login");
      }, 1000);
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
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-orange-500 py-3 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-medium text-orange-500 hover:text-orange-600"
          >
            Login
          </button>
        </p>
      </div>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
