"use client";

import { RequireAuth } from "@/components/layout/RequireAuth";
import { CouponManager } from "@/components/layout/CouponManager";

export default function AdminCouponsPage() {
  return (
    <RequireAuth guard="admin">
      <CouponManager scope="admin" />
    </RequireAuth>
  );
}
