import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app/AppLayout";
import { useBooker, getPro, PROS } from "@/lib/booker-store";
import { Send } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Booker NoW" }] }),
  component: Page,
});

function Page() {
  const messages = useBooker((s) => s.messages);
  const send = useBooker((s) => s.sendMessage);

  const proIdsWithMessages = useMemo(
    () => Array.from(new Set(messages.map((m) => m.proId))),
    [messages],
  );
  const [activeId, setActiveId] = useState(proIdsWithMessages[0] ?? PROS[0].id);
  const [text, setText] = useState("");

  const thread = messages.filter((m) => m.proId === activeId);
  const active = getPro(activeId);

  function handleSend() {
    if (!text.trim()) return;
    send(activeId, text);
    setText("");
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-5rem)]">
        <aside className="border-r border-border overflow-y-auto">
          <div className="p-5 font-semibold text-lg">Messages</div>
          {proIdsWithMessages.map((id) => {
            const p = getPro(id);
            const last = messages.filter((m) => m.proId === id).at(-1);
            return (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={`w-full px-5 py-3 flex gap-3 text-left transition ${
                  activeId === id ? "bg-accent/40" : "hover:bg-secondary"
                }`}
              >
                <img src={p.avatar} className="w-11 h-11 rounded-full object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{last?.text}</div>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="flex flex-col min-h-0">
          <header className="h-16 px-6 border-b border-border flex items-center gap-3">
            <img src={active.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
            <div>
              <div className="font-semibold text-sm">{active.name}</div>
              <div className="text-xs text-success">En ligne</div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {thread.map((m) => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                  m.from === "me" ? "bg-gradient-primary text-primary-foreground" : "bg-secondary"
                }`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Écrire un message..."
              className="flex-1 h-11 px-4 rounded-xl bg-secondary border border-transparent outline-none focus:border-primary text-sm"
            />
            <button onClick={handleSend} className="w-11 h-11 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
