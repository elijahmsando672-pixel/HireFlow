import { FormEvent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../lib/api";
import type { Conversation, Message } from "../lib/types";
import { formatTime, initials, timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";

export default function Messages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeId = params.get("user") ? parseInt(params.get("user")!, 10) : activeUserId;

  useEffect(() => {
    let cancelled = false;
    api
      .conversations()
      .then((data) => !cancelled && setConversations(data.conversations))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    setThreadLoading(true);

    const load = () =>
      api
        .thread(activeId)
        .then((data) => {
          if (cancelled) return;
          setMessages(data.messages);
        })
        .catch(() => {})
        .finally(() => !cancelled && setThreadLoading(false));

    load();
    const timer = setInterval(load, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (userId: number) => {
    setActiveUserId(userId);
    setParams({ user: String(userId) });
    setConversations((prev) => prev.map((c) => (c.userId === userId ? { ...c, unread: 0 } : c)));
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeId || !body.trim() || sending) return;
    setSending(true);
    try {
      await api.sendMessage({ recipientId: activeId, body: body.trim() });
      setBody("");
      const [threadData, convData] = await Promise.all([
        api.thread(activeId),
        api.conversations()
      ]);
      setMessages(threadData.messages);
      setConversations(convData.conversations);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader title="Messages" subtitle="Chat with clients and freelancers." />

      <div className="grid gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-3">
        {/* Conversation list */}
        <div className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="max-h-[70vh] overflow-y-auto lg:h-[70vh]">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-12">
                <EmptyState
                  icon={<MessageSquare size={32} />}
                  title="No conversations yet"
                  subtitle="Send a message to a freelancer or client from a job or gig page."
                />
              </div>
            ) : (
              conversations.map((conv) => {
                const selected = conv.userId === activeId;
                return (
                  <button
                    key={conv.userId}
                    onClick={() => selectConversation(conv.userId)}
                    className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left transition last:border-0 ${
                      selected ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                      {initials(conv.firstName, conv.lastName)}
                      {conv.unread > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {conv.unread}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-slate-900">
                          {conv.firstName} {conv.lastName}
                        </span>
                        {conv.lastAt && <span className="shrink-0 text-xs text-slate-400">{timeAgo(conv.lastAt)}</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-500">
                        {conv.lastMessage || "Say hello 👋"}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col lg:col-span-2">
          {!activeId ? (
            <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Select a conversation</h3>
              <p className="mt-1 max-w-xs text-sm text-slate-500">Choose a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <div className="flex h-[60vh] flex-col lg:h-[65vh]">
                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                  {threadLoading && messages.length === 0 ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-400">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg) => {
                      const mine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                              mine ? "bg-indigo-600 text-white" : "bg-white text-slate-800"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                            <p className={`mt-1 text-right text-[11px] ${mine ? "text-indigo-200" : "text-slate-400"}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Type a message…"
                    maxLength={5000}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    type="submit"
                    disabled={!body.trim() || sending}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Send size={17} />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
