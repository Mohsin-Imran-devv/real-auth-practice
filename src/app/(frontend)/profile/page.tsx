"use client";

import LogoutButton from "@/app/components/LogoutButton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
  image?: string;
  role: string;
};

type ProfileData = {
  message: string;
  user: User;
};

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);
  const router = useRouter();
  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/profile");
      const result = await res.json();

      if (!res.ok) {
        router.replace("/login");
        return;
      }

      setData(result);
    }

    fetchProfile();

    const interval = setInterval(async () => {
      const res = await fetch("/api/auth/session/refresh", {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        router.replace("/login");
      }
    }, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [router]);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-lg sm:p-9">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Profile
          </h1>

          <p className="mt-2 text-sm text-gray-500">Your account information</p>
        </div>

        <div className="mb-6 flex justify-center">
          {data.user.image ? (
            <img
              src={data.user.image}
              alt={data.user.name}
              width={120}
              height={120}
              className="h-30 w-30 rounded-full object-cover ring-4 ring-orange-100"
            />
          ) : (
            <div className="flex h-30 w-30 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-500">
              {data.user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900">
          {data.user.name}
        </h2>

        <div className="mt-6 divide-y rounded-xl border border-gray-200 text-left">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-500">Email</span>
            <span className="max-w-[65%] truncate text-sm font-medium text-gray-800">
              {data.user.email}
            </span>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-500">Role</span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium capitalize text-orange-600">
              {data.user.role}
            </span>
          </div>
        </div>
        <div className="mt-5">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
