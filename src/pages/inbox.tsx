// src/pages/inbox.tsx
//
// Phase 5 -- BWE Inbox. Real conversations only, backed by the existing
// `messages` collection via /api/messages/list.ts and
// /api/messages/send.ts.

import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import { canonicalUrl } from "@/lib/seo";

type Conversation = {
  withUserId: string;
  withName: string;
  lastMessage: string;
  lastMessageAt: string | null;
  unread: number;
};

type ThreadMessage = {
  id: string;
  fromMe: boolean;
  message: string;
  sentAt: string | null;
};

export default function InboxPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth({ silentOnPublic: false });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const withUserId =
    typeof router.query.with === "string" ? router.query.with : "";
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [withName, setWithName] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch("/api/messages/list", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data?.conversations || []);
      }
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadThread = async () => {
    if (!withUserId) return;
    const res = await fetch(
      `/api/messages/list?withUserId=${encodeURIComponent(withUserId)}`,
      { credentials: "include" },
    );
    if (res.ok) {
      const data = await res.json();
      setThread(data?.messages || []);
      setWithName(data?.withName || "BWE member");
    }
  };

  useEffect(() => {
    if (!user || !withUserId) return;
    loadThread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, withUserId]);

  async function handleSend() {
    if (!draft.trim() || !withUserId) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: withUserId, message: draft.trim() }),
      });
      if (res.ok) {
        setDraft("");
        await loadThread();
        await loadConversations();
      }
    } finally {
      setSending(false);
    }
  }

  const canonical = canonicalUrl("/inbox");

  return (
    <>
      <Head>
        <title>Inbox | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,follow" />
        <link rel="canonical" href={canonical} />
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="bwe-section-wrap py-8 sm:py-10">
          <div className="bwe-eyebrow">My BWE</div>
          <h1 className="bwe-display-title mt-2 text-3xl sm:text-4xl">Inbox</h1>

          {authLoading ? (
            <div className="mt-8 text-white/60">Loading…</div>
          ) : !user ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/70">
              <Link
                href="/login?next=/inbox"
                className="text-[var(--accent)] underline"
              >
                Log in
              </Link>{" "}
              to see your messages.
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-[18rem_minmax(0,1fr)]">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-2">
                {loadingConversations ? (
                  <div className="p-4 text-sm text-white/60">Loading…</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-sm text-white/60">
                    No conversations yet.
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.withUserId}
                      type="button"
                      onClick={() =>
                        router.push(
                          `/inbox?with=${encodeURIComponent(conv.withUserId)}`,
                        )
                      }
                      className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/5 ${
                        withUserId === conv.withUserId ? "bg-white/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold text-white/90">
                          {conv.withName}
                        </span>
                        {conv.unread > 0 ? (
                          <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-extrabold text-black">
                            {conv.unread}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-white/55">
                        {conv.lastMessage}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                {!withUserId ? (
                  <div className="text-sm text-white/60">
                    Select a conversation to view messages.
                  </div>
                ) : (
                  <>
                    <div className="border-b border-white/10 pb-3 text-sm font-semibold text-white/90">
                      {withName}
                    </div>
                    <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                      {thread.map((m) => (
                        <div
                          key={m.id}
                          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            m.fromMe
                              ? "ml-auto bg-yellow-500/15 text-yellow-100"
                              : "bg-white/5 text-white/85"
                          }`}
                        >
                          {m.message}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSend();
                        }}
                        placeholder="Write a message…"
                        className="bwe-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !draft.trim()}
                        className="rounded-lg bg-yellow-500 px-4 py-2 text-xs font-extrabold text-black disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
