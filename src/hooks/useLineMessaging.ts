import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function adminInvoke(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-manage-data", {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.data;
}

// ---- LINE Connection Test ----
export function useLineConnectionTest() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-line-message", {
        body: { action: "test_connection" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.data;
    },
  });
}

// ---- LINE Bulk Send ----
export function useLineBulkSend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { targets: { line_user_id: string; influencer_id: string }[]; message: string }) => {
      const { data, error } = await supabase.functions.invoke("send-line-message", {
        body: { action: "bulk_send", ...params, sent_by: "admin" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["line-message-logs"] });
    },
  });
}

// ---- LINE Message Logs ----
export function useLineMessageLogs(filters?: { messageType?: string; logStatus?: string }) {
  return useQuery({
    queryKey: ["line-message-logs", filters],
    queryFn: async () => {
      return adminInvoke("get_line_message_logs", {
        messageType: filters?.messageType,
        logStatus: filters?.logStatus,
        limit: 100,
      });
    },
  });
}
