import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExternalMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// Fetch messages for currently authenticated user
export function useExternalMessages(userId?: string | null) {
  return useQuery({
    queryKey: ["ext-messages", userId ?? "auth"],
    queryFn: async () => {
      let uid = userId;
      if (!uid) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];
        uid = session.user.id;
      }
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExternalMessage[];
    },
  });
}

export function useExternalAllMessages() {
  return useQuery({
    queryKey: ["ext-messages-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExternalMessage[];
    },
  });
}

// Send message using auth session's user ID as sender
export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { receiver_id: string; content: string; sender_id?: string }) => {
      let senderId = msg.sender_id;
      if (!senderId) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        senderId = session.user.id;
      }
      const { data, error } = await supabase.from("messages").insert({
        sender_id: senderId,
        receiver_id: msg.receiver_id,
        content: msg.content,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-messages"] });
      qc.invalidateQueries({ queryKey: ["ext-messages-all"] });
    },
  });
}

// Send notification (requires admin role or own user_id)
export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (notif: { user_id: string; title: string; message: string; type?: string; link?: string }) => {
      const { data, error } = await supabase.from("notifications").insert({
        user_id: notif.user_id,
        title: notif.title,
        message: notif.message,
        type: notif.type || "info",
        link: notif.link || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-notifications"] });
    },
  });
}
