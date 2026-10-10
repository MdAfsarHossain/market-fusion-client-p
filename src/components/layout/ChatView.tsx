"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationSummary,
} from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { useChat } from "@/providers/ChatProvider";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Spinner,
  cn,
} from "@/components/ui";

// One component drives both inboxes. The only difference is which endpoint
// lists the threads and whose name sits at the top of each row.
export const ChatView = ({
  side,
  initialConversationId,
}: {
  side: "buyer" | "store";
  /** A thread to open on arrival, from a "Message store" button's deep link. */
  initialConversationId?: string;
}) => {
  const listPath =
    side === "store" ? "/chat/store/conversations" : "/chat/conversations";

  const {
    connected,
    joinConversation,
    leaveConversation,
    onMessage,
    refreshUnread,
    sendTyping,
    onTyping,
  } = useChat();

  const [conversations, setConversations] = useState<ConversationSummary[] | null>(
    null,
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get<{
        unreadTotal: number;
        conversations: ConversationSummary[];
      }>(listPath, { query: { limit: 50 } });
      setConversations(res.data.conversations);
      return res.data.conversations;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load messages.");
      setConversations([]);
      return [];
    }
  }, [listPath]);

  useEffect(() => {
    void loadConversations().then((list) => {
      if (list.length === 0 && !initialConversationId) return;

      // A deep-linked thread wins over the default pick. It is trusted rather
      // than looked up in the list: reusing a thread only bumps updatedAt, so an
      // old thread keeps its old sort slot and can fall outside the 50 loaded
      // here. Checking membership would then quietly open the wrong one, which
      // is worse than the "could not load that thread" banner a bad id gets.
      setActiveId((current) => current ?? initialConversationId ?? list[0].id);
    });
  }, [loadConversations, initialConversationId]);

  const loadThread = useCallback(
    async (conversationId: string) => {
      setLoadingThread(true);
      setError(null);

      try {
        const res = await api.get<{
          conversation: ConversationDetail;
          messages: ChatMessage[];
        }>(`/chat/conversations/${conversationId}/messages`, {
          query: { limit: 100 },
        });
        setDetail(res.data.conversation);
        setMessages(res.data.messages);
        // Opening the thread clears the badge on the server, so mirror it here
        setConversations((prev) =>
          (prev || []).map((item) =>
            item.id === conversationId ? { ...item, unread_count: 0 } : item,
          ),
        );
        await refreshUnread();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Could not load that thread.");
      } finally {
        setLoadingThread(false);
      }
    },
    [refreshUnread],
  );

  useEffect(() => {
    if (!activeId) return;

    void loadThread(activeId);
    joinConversation(activeId);

    return () => leaveConversation(activeId);
  }, [activeId, loadThread, joinConversation, leaveConversation]);

  // Live messages land here rather than through a poll
  useEffect(() => {
    const off = onMessage((message) => {
      if (message.conversation_id === activeId) {
        setMessages((prev) =>
          prev.some((item) => item.id === message.id) ? prev : [...prev, message],
        );
        setPeerTyping(false);

        // The message is on screen, so it has been read. Without this the
        // server counter would keep climbing on a thread the user is looking
        // straight at, because only a fresh GET of the thread clears it.
        if (message.sender_role.toLowerCase() !== side) {
          void api
            .post(`/chat/conversations/${message.conversation_id}/read`, {})
            .then(() => refreshUnread())
            .catch(() => undefined);
        }
      }

      setConversations((prev) =>
        (prev || []).map((item) =>
          item.id === message.conversation_id
            ? {
                ...item,
                last_message_preview: message.body,
                last_message_at: message.createdAt,
                unread_count:
                  message.conversation_id === activeId
                    ? 0
                    : item.unread_count + 1,
              }
            : item,
        ),
      );
    });

    return off;
  }, [activeId, onMessage, side, refreshUnread]);

  useEffect(() => {
    const off = onTyping((payload) => {
      if (payload.conversation_id === activeId) {
        setPeerTyping(payload.is_typing);
        if (payload.is_typing) {
          setTimeout(() => setPeerTyping(false), 3000);
        }
      }
    });

    return off;
  }, [activeId, onTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeId || !draft.trim()) return;

    setSending(true);
    setError(null);

    try {
      const res = await api.post<ChatMessage>(
        `/chat/conversations/${activeId}/messages`,
        { body: draft.trim() },
      );
      // The socket echoes to the room too, so guard against a duplicate
      setMessages((prev) =>
        prev.some((item) => item.id === res.data.id) ? prev : [...prev, res.data],
      );
      setDraft("");
      sendTyping(activeId, false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send that.");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setDraft(value);
    if (!activeId) return;

    sendTyping(activeId, true);

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(activeId, false), 1500);
  };

  const counterpartName = (conversation: ConversationSummary) =>
    side === "store"
      ? conversation.buyer?.name || "Customer"
      : conversation.store?.name || "Store";

  return (
    <>
      <PageHeader
        title="Messages"
        description={
          connected
            ? "Connected — new messages arrive instantly."
            : "Offline — messages will still send, just without live updates."
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {conversations === null ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand-600" />
        </div>
      ) : conversations.length === 0 && !activeId ? (
        // Guarded on activeId too: this branch replaces the transcript as well as
        // the list, so a failed list request would otherwise strand a buyer on
        // the very thread a "Message store" button just sent them to.
        <EmptyState
          title="No messages yet"
          description={
            side === "store"
              ? "When a customer messages your store it will appear here."
              : "Use the Message store button on any store, product or order page to start one."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* Thread list */}
          <Card className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                className={cn(
                  "block w-full px-4 py-3 text-left transition-colors",
                  conversation.id === activeId
                    ? "bg-brand-50/60"
                    : "hover:bg-slate-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">
                    {counterpartName(conversation)}
                  </span>
                  {conversation.unread_count > 0 && (
                    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>

                {conversation.order_number && (
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    {conversation.order_number}
                  </p>
                )}

                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {conversation.last_message_preview || "No messages yet"}
                </p>
                {conversation.last_message_at && (
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatDateTime(conversation.last_message_at)}
                  </p>
                )}
              </button>
            ))}
          </Card>

          {/* Transcript */}
          <Card className="flex max-h-[70vh] flex-col">
            {detail && (
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  {side === "store" ? detail.buyer.name : detail.store.name}
                </p>
                {detail.subject && (
                  <p className="text-xs text-slate-500">{detail.subject}</p>
                )}
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loadingThread ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-5 w-5 text-brand-600" />
                </div>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No messages yet. Say hello.
                </p>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_role === detail?.my_side;

                  return (
                    <div
                      key={message.id}
                      className={cn("flex", isMine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-3.5 py-2",
                          isMine
                            ? "bg-brand-600 text-white"
                            : "bg-slate-100 text-slate-900",
                        )}
                      >
                        {!isMine && message.sender_name && (
                          <p className="mb-0.5 text-[11px] font-semibold text-slate-500">
                            {message.sender_name}
                          </p>
                        )}
                        <p className="whitespace-pre-line text-sm">{message.body}</p>
                        <p
                          className={cn(
                            "mt-1 text-[11px]",
                            isMine ? "text-white/70" : "text-slate-400",
                          )}
                        >
                          {formatDateTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {peerTyping && (
                <p className="text-xs italic text-slate-400">typing…</p>
              )}

              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
              <Input
                value={draft}
                onChange={(event) => handleTyping(event.target.value)}
                placeholder="Write a message…"
                maxLength={4000}
                aria-label="Message"
              />
              <Button type="submit" loading={sending} disabled={!draft.trim()}>
                Send
              </Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
};
