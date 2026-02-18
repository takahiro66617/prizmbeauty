import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabaseExternal";

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
  created_at: string;
  updated_at: string;
}

export function useExternalInfluencers() {
  return useQuery({
    queryKey: ["ext-influencers"],
    queryFn: async () => {
      const { data, error } = await supabaseExternal.from("influencers").select("*").order("created_at", { ascending: false });
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
      const { data, error } = await supabaseExternal.from("influencers").select("*").eq("id", id).single();
      if (error) throw error;
      return data as ExternalInfluencer;
    },
    enabled: !!id,
  });
}

// useUpdateInfluencerStatus is disabled because the external DB does not have a 'status' column
export function useUpdateInfluencerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.warn("Status update is not supported: external DB has no 'status' column");
      return { id, status };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-influencers"] });
    },
  });
}
