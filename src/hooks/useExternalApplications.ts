import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExternalApplication {
  id: string;
  campaign_id: string;
  influencer_id: string;
  company_id: string;
  status: string;
  motivation: string | null;
  applied_at: string;
  updated_at: string;
  campaigns?: { id: string; title: string; image_url: string | null; budget_min: number | null; budget_max: number | null; deadline: string | null; category: string | null; companies?: { id: string; name: string } | null } | null;
  influencer_profiles?: { id: string; name: string; username: string; image_url: string | null; instagram_followers: number | null; tiktok_followers: number | null; youtube_followers: number | null; category: string | null; bio: string | null; status: string } | null;
}

export function useExternalApplications(filters?: { companyId?: string; influencerId?: string; campaignId?: string }) {
  return useQuery({
    queryKey: ["ext-applications", filters],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select("*, campaigns(id, title, image_url, budget_min, budget_max, deadline, category, companies(id, name)), influencer_profiles(id, name, username, image_url, instagram_followers, tiktok_followers, youtube_followers, category, bio, status)")
        .order("applied_at", { ascending: false });
      if (filters?.companyId) query = query.eq("company_id", filters.companyId);
      if (filters?.influencerId) query = query.eq("influencer_id", filters.influencerId);
      if (filters?.campaignId) query = query.eq("campaign_id", filters.campaignId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ExternalApplication[];
    },
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.from("applications").update({ status }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-applications"] });
    },
  });
}
