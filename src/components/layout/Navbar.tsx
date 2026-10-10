"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useCart } from "@/providers/CartProvider";
import { useNotifications } from "@/providers/NotificationProvider";
import { useChat } from "@/providers/ChatProvider";
import { ButtonLink, cn } from "@/components/ui";

const navLinks = [
  { href: "/products", label: "Products" },
  { href: "/stores", label: "Stores" },
];

export const Navbar = () => {
  const { user, ready, isVendor, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { unreadCount } = useNotifications();
  const { unreadCount: chatUnread } = useChat();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            MF
          </span>
          <span className="hidden sm:inline">Market Fusion</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <Link
              href="/messages"
              className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label={`Messages${chatUnread > 0 ? `, ${chatUnread} unread` : ""}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  d="M20 12a7 7 0 01-7 7H8l-4 3v-5.5A7 7 0 0111 5h2a7 7 0 017 7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {chatUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </Link>
          )}

          {user && (
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                  d="M18 8a6 6 0 10-12 0c0 6-2.5 7-2.5 7h17S18 14 18 8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10.3 20a2 2 0 003.4 0" strokeLinecap="round" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label={`Cart with ${itemCount} item${itemCount === 1 ? "" : "s"}`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2.5 3h2l2.2 11.2a1.5 1.5 0 001.5 1.2h9.1a1.5 1.5 0 001.5-1.2L20.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9.5" cy="20" r="1.4" />
              <circle cx="17.5" cy="20" r="1.4" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {!ready ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold uppercase text-slate-600">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </span>
                <span className="hidden max-w-24 truncate sm:inline">{user.name}</span>
                <svg className={cn("h-4 w-4 transition-transform", menuOpen && "rotate-180")} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                </svg>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div
                    role="menu"
                    className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>

                    <MenuLink href="/profile" onClick={() => setMenuOpen(false)}>
                      My profile
                    </MenuLink>
                    <MenuLink href="/orders" onClick={() => setMenuOpen(false)}>
                      My orders
                    </MenuLink>
                    <MenuLink href="/bookings" onClick={() => setMenuOpen(false)}>
                      Bookings
                    </MenuLink>
                    <MenuLink href="/reviews" onClick={() => setMenuOpen(false)}>
                      My reviews
                    </MenuLink>
                    <MenuLink href="/wallet" onClick={() => setMenuOpen(false)}>
                      Wallet
                    </MenuLink>
                    <MenuLink href="/addresses" onClick={() => setMenuOpen(false)}>
                      Addresses
                    </MenuLink>

                    {isVendor ? (
                      <MenuLink href="/vendor" onClick={() => setMenuOpen(false)}>
                        Vendor dashboard
                      </MenuLink>
                    ) : (
                      !isAdmin && (
                        <MenuLink href="/vendor/store/new" onClick={() => setMenuOpen(false)}>
                          Become a vendor
                        </MenuLink>
                      )
                    )}

                    {isAdmin && (
                      <MenuLink href="/admin/stores" onClick={() => setMenuOpen(false)}>
                        Admin panel
                      </MenuLink>
                    )}

                    <div className="mt-1 border-t border-slate-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="block w-full px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="sm">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      <nav className="border-t border-slate-100 md:hidden">
        <div className="container-page flex gap-1 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

const MenuLink = ({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    onClick={onClick}
    role="menuitem"
    className="block px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
  >
    {children}
  </Link>
);
