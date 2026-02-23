import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExternalInfluencer {
  id: string;
  user_id: string | null;
  line_user_id: string | null;
  username: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  category: string | null;
  status: string;
  instagram_followers: number | null;
  tiktok_followers: number | null;
  youtube_followers: number | null;
  twitter_followers: number | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useExternalInfluencers() {
  return useQuery({
    queryKey: ["ext-influencers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("influencer_profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExternalInfluencer[];
    },
  });
}

export function useExternalInfluencer(id: string | null) {
  return useQuery({
    queryKey: ["ext-influencer", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("influencer_profiles").select("*").eq("id", id).single();
      if (error) throw error;
      return data as ExternalInfluencer;
    },
    enabled: !!id,
  });
}

export function useUpdateInfluencerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-update-influencer", {
        body: { id, updates: { status } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-influencers"] });
    },
  });
}
