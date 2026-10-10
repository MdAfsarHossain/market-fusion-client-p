"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";

// A standing reminder that this session cannot change anything. Deliberately
// not dismissible: the alternative is a visitor clicking Save, getting a 403,
// and concluding the app is broken.
export const DemoBanner = () => {
  const { isDemo, user, ready } = useAuth();

  if (!ready || !isDemo) return null;

  const area =
    user?.role === "VENDOR"
      ? "vendor"
      : user?.role === "ADMIN" || user?.role === "SUPERADMIN"
        ? "admin"
        : "buyer";

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-2 text-center text-xs text-amber-900">
        <span aria-hidden="true">👀</span>
        <span>
          You are exploring the <strong>{area} demo</strong> — read-only, so
          nothing you click will change any data.
        </span>
        <Link
          href="/register"
          className="font-medium underline underline-offset-2 hover:text-amber-950"
        >
          Create a real account
        </Link>
      </div>
    </div>
  );
};
