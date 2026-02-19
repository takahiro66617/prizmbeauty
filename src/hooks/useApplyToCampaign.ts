import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function getInfluencerProfileId(): string | null {
  const u = sessionStorage.getItem("currentUser");
  if (u) return JSON.parse(u).id || null;
  return null;
}

export function useApplyToCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      campaignId,
      companyId,
      influencerId,
      motivation,
    }: {
      campaignId: string;
      companyId: string;
      influencerId: string;
      motivation?: string;
    }) => {
      const profileId = getInfluencerProfileId();

      // Use edge function for LINE-auth users (no Supabase session)
      if (profileId) {
        const { data, error } = await supabase.functions.invoke("apply-to-campaign", {
          body: {
            influencerProfileId: profileId,
            campaignId,
            companyId,
            motivation: motivation || null,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data.data;
      }

      // Fallback for Supabase-auth users
      const { data, error } = await supabase
        .from("applications")
        .insert({
          campaign_id: campaignId,
          company_id: companyId,
          influencer_id: influencerId,
          motivation: motivation || null,
          status: "applied",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-applications"] });
    },
  });
}
