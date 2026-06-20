import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker } from "@/lib/booker-store";
import { Send, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/pro/messages")({
  head: () => ({ meta: [{ title: "Messages clients — Booker Pro" }] }),
  component: Page,
});

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

function Page() {
  const messages = useBooker((s) => s.proMessages);
  const send = useBooker((s) => s.sendProMessage);
  const clients = useBooker((s) => s.proClients);

  const clientIds = useMemo(
    () => Array.from(new Set(messages.map((m) => m.clientId))),
    [messages],
  );
  const [activeId, setActiveId] = useState(clientIds[0] ?? clients[0]?.id ?? "");
  const [text, setText] = useState("");

  const thread = messages.filter((m) => m.clientId === activeId);
  const active = clients.find((c) => c.id === activeId);

  function handleSend() {
    if (!text.trim() || !active) return;
    send(activeId, text);
    setText("");
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-5rem)]">
        <aside className="border-r border-border overflow-y-auto bg-card">
          <div className="p-5 font-semibold text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" /> Vos clients
          </div>
          {clientIds.length === 0 && (
            <div className="px-5 text-sm text-muted-foreground">Aucune conversation.</div>
          )}
          {clientIds.map((id) => {
            const c = clients.find((x) => x.id === id);
            if (!c) return null;
            const last = messages.filter((m) => m.clientId === id).at(-1);
            const unread = messages.some((m) => m.clientId === id && m.from === "client");
            return (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={`w-full px-5 py-3 flex gap-3 text-left transition ${
                  activeId === id ? "bg-emerald-50" : "hover:bg-secondary"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center">
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {c.name}
                    {c.vip && <span className="text-[9px] font-bold bg-warning text-warning-foreground px-1.5 py-0.5 rounded">VIP</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{last?.text}</div>
                </div>
                {unread && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-3.5" />}
              </button>
            );
          })}
        </aside>

        <section className="flex flex-col min-h-0">
          {active ? (
            <>
              <header className="h-16 px-6 border-b border-border flex items-center gap-3 bg-emerald-50/40">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-semibold flex items-center justify-center">
                  {initials(active.name)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{active.name}</div>
                  <div className="text-xs text-muted-foreground">{active.visits} visites · {active.spent} € dépensés</div>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-secondary/20">
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                      m.from === "me" ? "bg-emerald-500 text-white" : "bg-card border border-border"
                    }`}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border flex gap-2 bg-card">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Répondre à votre client..."
                  className="flex-1 h-11 px-4 rounded-xl bg-secondary border border-transparent outline-none focus:border-emerald-500 text-sm"
                />
                <button onClick={handleSend} className="w-11 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Sélectionnez une conversation
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
