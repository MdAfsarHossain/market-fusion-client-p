"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { Cart } from "@/lib/types";
import { useAuth } from "./AuthProvider";

type CartContextValue = {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, ready } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }

    setLoading(true);

    try {
      const res = await api.get<Cart>("/cart");
      setCart(res.data);
    } catch {
      // A failed cart read should never block the page the user is on
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ready) {
      void refresh();
    }
  }, [ready, refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      itemCount: cart?.summary.total_items ?? 0,
      refresh,
    }),
    [cart, loading, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }

  return context;
};
