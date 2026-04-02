import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function getInfluencerProfileId(): string | null {
  try {
    const currentUser = sessionStorage.getItem("currentUser");
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.id) return parsed.id;
    }

    const lineUser = localStorage.getItem("line_user");
    if (lineUser) {
      const parsed = JSON.parse(lineUser);
      return parsed.influencerProfileId || parsed.id || null;
    }
  } catch {
    // noop
  }

  return null;
}

export function useCurrentInfluencerStatus() {
  const queryClient = useQueryClient();
  const profileId = getInfluencerProfileId();

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`current-influencer-status-${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "influencer_profiles",
          filter: `id=eq.${profileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["current-influencer-status", profileId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

  const query = useQuery({
    queryKey: ["current-influencer-status", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      if (!profileId) return null;

      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("status")
        .eq("id", profileId)
        .maybeSingle();

      if (error) throw error;
      return data?.status ?? null;
    },
  });

  return {
    profileId,
    status: query.data ?? null,
    isLoading: query.isLoading,
  };
}
