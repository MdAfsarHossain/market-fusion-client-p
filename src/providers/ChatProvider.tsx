"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { api, getToken } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { useAuth } from "./AuthProvider";

// The socket lives on the API origin, not the /api/v2 path
const SOCKET_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v2"
).replace(/\/api\/v\d+\/?$/, "");

type MessageHandler = (message: ChatMessage) => void;

type ChatContextValue = {
  connected: boolean;
  unreadCount: number;
  refreshUnread: () => Promise<void>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  onMessage: (handler: MessageHandler) => () => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  onTyping: (handler: (payload: { conversation_id: string; is_typing: boolean }) => void) => () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user, ready } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Handlers are kept in refs so the socket does not need re-wiring whenever a
  // screen mounts a new listener.
  const messageHandlers = useRef(new Set<MessageHandler>());
  const typingHandlers = useRef(
    new Set<(p: { conversation_id: string; is_typing: boolean }) => void>(),
  );

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const res = await api.get<{ unreadCount: number }>("/chat/unread-count");
      setUnreadCount(res.data.unreadCount);
    } catch {
      // A failed poll must not disturb the page
    }
  }, [user]);

  useEffect(() => {
    if (!ready || !user) {
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
      setUnreadCount(0);
      return;
    }

    void refreshUnread();

    const token = getToken();
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    // A socket failure is not fatal: the REST endpoints still work, the UI just
    // stops updating live.
    socket.on("connect_error", () => setConnected(false));

    socket.on("message:new", (message: ChatMessage) => {
      messageHandlers.current.forEach((handler) => handler(message));
    });

    socket.on("conversation:updated", () => {
      void refreshUnread();
    });

    socket.on("typing", (payload) => {
      typingHandlers.current.forEach((handler) => handler(payload));
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [ready, user, refreshUnread]);

  const value = useMemo<ChatContextValue>(
    () => ({
      connected,
      unreadCount,
      refreshUnread,
      joinConversation: (id) => socketRef.current?.emit("conversation:join", id),
      leaveConversation: (id) => socketRef.current?.emit("conversation:leave", id),
      onMessage: (handler) => {
        messageHandlers.current.add(handler);
        return () => messageHandlers.current.delete(handler);
      },
      sendTyping: (id, isTyping) =>
        socketRef.current?.emit("typing", {
          conversation_id: id,
          is_typing: isTyping,
        }),
      onTyping: (handler) => {
        typingHandlers.current.add(handler);
        return () => typingHandlers.current.delete(handler);
      },
    }),
    [connected, unreadCount, refreshUnread],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside a ChatProvider");
  }

  return context;
};
