import type { Metadata } from "next";
import { DashboardNav } from "@/components/layout/DashboardNav";

export const metadata: Metadata = {
  title: "Admin",
};

const links = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/withdrawals", label: "Withdrawals" },
  { href: "/admin/inventory", label: "Low stock" },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="container-page py-8">
      <DashboardNav title="Admin" links={links} />
      {children}
    </div>
  );
}
