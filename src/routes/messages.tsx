import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/app/AppLayout";
import { listMyConversations, sendConversationMessage } from "@/lib/messages.functions";
import { Inbox, Loader2, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Booker NoW" }] }),
  component: Page,
});

type ProSummary = {
  id: string;
  name: string;
  job: string;
  avatar_url: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type ConversationRow = {
  id: string;
  client_id: string;
  pro_id: string;
  created_at: string;
  updated_at: string;
  pro: ProSummary | null;
  client: null;
  messages: MessageRow[];
};

type ConversationsPayload = {
  userId: string;
  conversations: ConversationRow[];
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "P";
}

function Page() {
  const queryClient = useQueryClient();
  const fetchConversations = useServerFn(listMyConversations);
  const sendMessage = useServerFn(sendConversationMessage);

  const [activeId, setActiveId] = useState("");
  const [text, setText] = useState("");

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["messages", "client"],
    queryFn: () => fetchConversations(),
  });

  const payload = data as ConversationsPayload | undefined;
  const conversations = payload?.conversations ?? [];
  const userId = payload?.userId ?? "";

  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeId) ?? conversations[0] ?? null;
  }, [activeId, conversations]);

  const mutation = useMutation({
    mutationFn: (body: string) => {
      if (!activeConversation) throw new Error("Aucune conversation sélectionnée.");

      return sendMessage({
        data: {
          conversation_id: activeConversation.id,
          body,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "client"] });
      setText("");
    },
    onError: (sendError) => {
      toast.error(sendError instanceof Error ? sendError.message : "Impossible d'envoyer le message");
    },
  });

  function handleSend() {
    const body = text.trim();
    if (!body || mutation.isPending) return;

    mutation.mutate(body);
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-5rem)]">
        <aside className="border-r border-border overflow-y-auto">
          <div className="p-5 font-semibold text-lg">Messages</div>

          {isLoading && (
            <div className="px-5 py-6 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement…
            </div>
          )}

          {!isLoading && isError && (
            <div className="px-5 py-6 text-sm text-destructive">
              {error instanceof Error ? error.message : "Impossible de charger les messages."}
            </div>
          )}

          {!isLoading && !isError && conversations.length === 0 && (
            <div className="px-5 py-6 text-sm text-muted-foreground">Aucune conversation pour le moment.</div>
          )}

          {!isLoading && !isError && conversations.map((conversation) => {
            const pro = conversation.pro;
            const last = conversation.messages.at(-1);

            return (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                className={`w-full px-5 py-3 flex gap-3 text-left transition ${
                  activeConversation?.id === conversation.id ? "bg-accent/40" : "hover:bg-secondary"
                }`}
              >
                {pro?.avatar_url ? (
                  <img src={pro.avatar_url} className="w-11 h-11 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                    {getInitial(pro?.name ?? "Professionnel")}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{pro?.name ?? "Professionnel"}</div>
                  <div className="text-xs text-muted-foreground truncate">{last?.body ?? "Aucun message"}</div>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="flex flex-col min-h-0">
          {activeConversation ? (
            <>
              <header className="h-16 px-6 border-b border-border flex items-center gap-3">
                {activeConversation.pro?.avatar_url ? (
                  <img src={activeConversation.pro.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                    {getInitial(activeConversation.pro?.name ?? "Professionnel")}
                  </div>
                )}

                <div>
                  <div className="font-semibold text-sm">{activeConversation.pro?.name ?? "Professionnel"}</div>
                  <div className="text-xs text-success">Conversation active</div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {activeConversation.messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Aucun message dans cette conversation.
                  </div>
                )}

                {activeConversation.messages.map((message) => {
                  const isMine = message.sender_id === userId;

                  return (
                    <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                        isMine ? "bg-gradient-primary text-primary-foreground" : "bg-secondary"
                      }`}>
                        {message.body}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-border flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Écrire un message..."
                  className="flex-1 h-11 px-4 rounded-xl bg-secondary border border-transparent outline-none focus:border-primary text-sm"
                />

                <button
                  onClick={handleSend}
                  disabled={mutation.isPending || !text.trim()}
                  className="w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow disabled:opacity-50"
                >
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm">
              <Inbox className="w-10 h-10 mb-3" />
              Sélectionnez une conversation
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
