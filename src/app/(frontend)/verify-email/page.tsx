"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasVerified = useRef(false);

  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (hasVerified.current) return;

    hasVerified.current = true;

    const token = searchParams.get("token");

    if (!token) {
      setMessage("Invalid verification link");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message);
          return;
        }

        setMessage(data.message);

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } catch {
        setMessage("Something went wrong");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return <h1>{message}</h1>;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<h1>Loading...</h1>}>
      <VerifyEmailContent />
    </Suspense>
  );
}