import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
