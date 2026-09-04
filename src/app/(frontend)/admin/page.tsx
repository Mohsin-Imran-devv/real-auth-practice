"use client";

import LogoutButton from "@/app/components/LogoutButton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AdminData = {
  message: string;
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  };
};

type User = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  isMainAdmin: boolean;
  isVerified: boolean;
};

export default function Admin() {
  const router = useRouter();
  const [data, setData] = useState<AdminData | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await fetch("/api/admin");
        const result = await res.json();

        if (!res.ok) {
          router.replace("/profile");
          return;
        }

        setData(result);
      } catch (error) {
        console.log(error);
      }
    }

    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        const result = await res.json();

        if (!res.ok) {
          toast.error(result.message);
          return;
        }

        setUsers(result.users);
      } catch (error) {
        console.log(error);
      }
    }

    fetchAdmin();
    fetchUsers();

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

  async function updateRole(id: string, role: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === id ? { ...user, role } : user,
        ),
      );
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  function confirmDelete(id: string) {
    toast("Delete this user?", {
      description: "This action cannot be undone.",
      action: (
        <button
          onClick={() => deleteUser(id)}
          className="h-7 rounded-md bg-red-500 px-3 text-xs font-medium text-white hover:bg-red-600"
        >
          Delete
        </button>
      ),
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  }

  async function deleteUser(id: string) {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user._id !== id),
      );
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome, Admin
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your account and users
          </p>
        </div>

        {/* Admin Profile */}
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            {/* Avatar */}
            {data.user.image ? (
              <img
                src={data.user.image}
                alt={data.user.name}
                width={100}
                height={100}
                className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-orange-50"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-orange-100 text-3xl font-bold text-orange-500">
                {data.user.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Admin Info */}
            <div className="text-center sm:text-left">
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {data.user.name}
                </h2>

                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold capitalize text-orange-600">
                  {data.user.role}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">{data.user.email}</p>
            </div>
          </div>

          {/* Message */}
          <div className="mt-6 rounded-xl bg-orange-50 px-4 py-3 ring-1 ring-orange-100">
            <p className="text-sm font-medium text-orange-700">
              {data.message}
            </p>
          </div>

          {/* Logout */}
          <div className="mt-6 flex justify-center sm:justify-start">
            <LogoutButton />
          </div>
        </section>

        {/* User Management */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                User Management
              </h2>

              <p className="text-sm text-gray-500">
                Manage registered users and their roles
              </p>
            </div>

            <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {users.length} Users
            </span>
          </div>

          {/* Users */}
          <div className="mt-6 space-y-3">
            {users.map((user) => (
              <div
                key={user._id}
                className="rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* User Info */}
                  <div className="flex min-w-0 items-center gap-3">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        width={45}
                        height={45}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-500">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {user.name}
                      </p>

                      <p className="truncate text-sm text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        user.isVerified
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {user.isVerified ? "Verified" : "Unverified"}
                    </span>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium capitalize text-orange-600">
                      {user.role}
                    </span>

                    {!user.isMainAdmin && user._id !== data.user._id && (
                      <>
                        <button
                          onClick={() =>
                            updateRole(
                              user._id,
                              user.role === "admin" ? "user" : "admin",
                            )
                          }
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          {user.role === "admin" ? "Make User" : "Make Admin"}
                        </button>

                        <button
                          onClick={() => confirmDelete(user._id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
                <p className="text-sm text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
