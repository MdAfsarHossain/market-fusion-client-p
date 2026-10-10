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
import { useAuth } from "./AuthProvider";

type NotificationContextValue = {
  unreadCount: number;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

// How often the bell re-checks. Long enough to be cheap, short enough that a
// vendor sees a new order without reloading.
const POLL_INTERVAL_MS = 60_000;

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, ready } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await api.get<{ unreadCount: number }>(
        "/notification/unread-count",
      );
      setUnreadCount(res.data.unreadCount);
    } catch {
      // A failed poll should never disturb the page the user is on
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;

    void refresh();

    if (!user) return;

    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [ready, user, refresh]);

  const value = useMemo<NotificationContextValue>(
    () => ({ unreadCount, refresh }),
    [unreadCount, refresh],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used inside a NotificationProvider");
  }

  return context;
};
