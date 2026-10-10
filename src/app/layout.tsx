import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { ChatProvider } from "@/providers/ChatProvider";

export const metadata: Metadata = {
  title: {
    default: "Market Fusion — Hybrid Multi-Vendor Marketplace",
    template: "%s · Market Fusion",
  },
  description:
    "Buy and sell physical products, digital downloads, services and rentals from independent vendors, all in one marketplace.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <ChatProvider>
                <DemoBanner />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </ChatProvider>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
