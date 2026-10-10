import Link from "next/link";

const columns = [
  {
    title: "Marketplace",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?type=PHYSICAL", label: "Physical goods" },
      { href: "/products?type=DIGITAL", label: "Digital downloads" },
      { href: "/products?type=SERVICE", label: "Services" },
      { href: "/products?type=RENTAL", label: "Rentals" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/vendor/store/new", label: "Open a store" },
      { href: "/vendor", label: "Vendor dashboard" },
      { href: "/stores", label: "Browse stores" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/orders", label: "My orders" },
      { href: "/cart", label: "Cart" },
      { href: "/bookings", label: "Bookings" },
      { href: "/messages", label: "Messages" },
      { href: "/addresses", label: "Addresses" },
    ],
  },
];

export const Footer = () => (
  <footer className="mt-16 border-t border-slate-200 bg-white">
    <div className="container-page py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              MF
            </span>
            Market Fusion
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            One marketplace for physical goods, digital downloads, services and rentals.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-slate-900">{column.title}</h3>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-brand-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-400">
        © {new Date().getFullYear()} Market Fusion. All rights reserved.
      </p>
    </div>
  </footer>
);
