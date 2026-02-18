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

export function useExternalMessages(userId: string | null) {
  return useQuery({
    queryKey: ["ext-messages", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExternalMessage[];
    },
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { sender_id: string; receiver_id: string; content: string }) => {
      const { data, error } = await supabase.from("messages").insert(msg).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-messages"] });
    },
  });
}
