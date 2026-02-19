import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*, campaigns(*, companies(id, name, logo_url))")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useIsFavorite(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["favorite-check", campaignId],
    queryFn: async () => {
      if (!campaignId) return false;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("campaign_id", campaignId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!campaignId,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const userId = session.user.id;
      // Check if exists
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("campaign_id", campaignId)
        .maybeSingle();
      if (existing) {
        await supabase.from("favorites").delete().eq("id", existing.id);
        return { action: "removed" as const };
      } else {
        await supabase.from("favorites").insert({ user_id: userId, campaign_id: campaignId });
        return { action: "added" as const };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favorite-check"] });
    },
  });
}
