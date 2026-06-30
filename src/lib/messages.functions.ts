import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
});

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

function groupMessagesByConversation(messages: MessageRow[]) {
  const map = new Map<string, MessageRow[]>();

  for (const message of messages) {
    const current = map.get(message.conversation_id) ?? [];
    current.push(message);
    map.set(message.conversation_id, current);
  }

  return map;
}

export const listMyConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: conversations, error } = await context.supabase
      .from("conversations")
      .select("id, client_id, pro_id, created_at, updated_at, pros:pro_id(id, name, job, avatar_url)")
      .eq("client_id", context.userId)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    const conversationIds = (conversations ?? []).map((conversation) => conversation.id);

    if (conversationIds.length === 0) {
      return { userId: context.userId, conversations: [] };
    }

    const { data: messages, error: messagesError } = await context.supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true });

    if (messagesError) throw new Error(messagesError.message);

    const messagesByConversation = groupMessagesByConversation((messages ?? []) as MessageRow[]);

    return {
      userId: context.userId,
      conversations: (conversations ?? []).map((conversation) => {
        const pro = Array.isArray(conversation.pros) ? conversation.pros[0] ?? null : conversation.pros;

        return {
          id: conversation.id,
          client_id: conversation.client_id,
          pro_id: conversation.pro_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          pro,
          client: null,
          messages: messagesByConversation.get(conversation.id) ?? [],
        };
      }),
    };
  });

export const listProConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: pro, error: proError } = await context.supabase
      .from("pros")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (proError) throw new Error(proError.message);

    if (!pro) {
      return { userId: context.userId, conversations: [] };
    }

    const { data: conversations, error } = await context.supabase
      .from("conversations")
      .select("id, client_id, pro_id, created_at, updated_at")
      .eq("pro_id", pro.id)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);

    const conversationIds = (conversations ?? []).map((conversation) => conversation.id);
    const clientIds = Array.from(new Set((conversations ?? []).map((conversation) => conversation.client_id)));

    if (conversationIds.length === 0) {
      return { userId: context.userId, conversations: [] };
    }

    const [{ data: messages, error: messagesError }, { data: clients, error: clientsError }] = await Promise.all([
      context.supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true }),

      context.supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone")
        .in("id", clientIds),
    ]);

    if (messagesError) throw new Error(messagesError.message);
    if (clientsError) throw new Error(clientsError.message);

    const messagesByConversation = groupMessagesByConversation((messages ?? []) as MessageRow[]);
    const clientsById = new Map((clients ?? []).map((client) => [client.id, client]));

    return {
      userId: context.userId,
      conversations: (conversations ?? []).map((conversation) => ({
        id: conversation.id,
        client_id: conversation.client_id,
        pro_id: conversation.pro_id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        pro: null,
        client: clientsById.get(conversation.client_id) ?? null,
        messages: messagesByConversation.get(conversation.id) ?? [],
      })),
    };
  });

export const sendConversationMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => sendMessageSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: conversation, error: conversationError } = await context.supabase
      .from("conversations")
      .select("id, client_id, pro_id")
      .eq("id", data.conversation_id)
      .maybeSingle();

    if (conversationError) throw new Error(conversationError.message);

    if (!conversation) {
      throw new Error("Conversation introuvable.");
    }

    let isParticipant = conversation.client_id === context.userId;

    if (!isParticipant) {
      const { data: pro, error: proError } = await context.supabase
        .from("pros")
        .select("id")
        .eq("id", conversation.pro_id)
        .eq("user_id", context.userId)
        .maybeSingle();

      if (proError) throw new Error(proError.message);

      isParticipant = Boolean(pro);
    }

    if (!isParticipant) {
      throw new Error("Vous ne pouvez pas envoyer de message dans cette conversation.");
    }

    const { data: message, error } = await context.supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: context.userId,
        body: data.body,
      })
      .select("id, conversation_id, sender_id, body, created_at")
      .single();

    if (error) throw new Error(error.message);

    await context.supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversation.id);

    return message;
  });
