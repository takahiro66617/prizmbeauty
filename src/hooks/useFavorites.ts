import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function getInfluencerProfileId(): string | null {
  const u = sessionStorage.getItem("currentUser");
  if (u) return JSON.parse(u).id || null;
  return null;
}

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      // Try auth session first
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id || getInfluencerProfileId();
      if (!userId) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*, campaigns(*, companies(id, name, logo_url))")
        .eq("user_id", userId)
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
      const userId = session?.user.id || getInfluencerProfileId();
      if (!userId) return false;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
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
      const profileId = getInfluencerProfileId();
      // Use edge function for LINE-auth users
      if (profileId) {
        const { data, error } = await supabase.functions.invoke("toggle-favorite", {
          body: { influencerProfileId: profileId, campaignId },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data as { action: "added" | "removed" };
      }
      // Fallback for Supabase-auth users
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const userId = session.user.id;
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
