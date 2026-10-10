"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

export const DashboardNav = ({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) => {
  const pathname = usePathname();

  // The index link should only light up on an exact match, otherwise every
  // nested route would highlight it too.
  const isActive = (href: string) =>
    pathname === href || (href !== links[0].href && pathname.startsWith(`${href}/`));

  return (
    <div className="mb-8 border-b border-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{title}</p>
      <nav className="mt-3 flex gap-1 overflow-x-auto">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(link.href)
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
