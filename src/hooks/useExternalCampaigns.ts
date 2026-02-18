import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExternalCampaign {
  id: string;
  title: string;
  description: string | null;
  company_id: string;
  category: string | null;
  image_url: string | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  requirements: string | null;
  platform: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  max_applicants: number | null;
  payment_date: string | null;
  deliverables: string | null;
  companies?: { id: string; name: string; logo_url: string | null } | null;
}

export function useExternalCampaigns(companyId?: string) {
  return useQuery({
    queryKey: ["ext-campaigns", companyId],
    queryFn: async () => {
      let query = supabase.from("campaigns").select("*, companies(id, name, logo_url)");
      if (companyId) query = query.eq("company_id", companyId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExternalCampaign[];
    },
  });
}

export function useExternalCampaign(id: string | null) {
  return useQuery({
    queryKey: ["ext-campaign", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("campaigns").select("*, companies(id, name, logo_url)").eq("id", id).single();
      if (error) throw error;
      return data as ExternalCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: {
      title: string;
      description: string;
      company_id: string;
      category: string;
      budget_min: number;
      budget_max: number;
      deadline: string;
      requirements: string;
      platform: string;
      image_url?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase.from("campaigns").insert({ ...campaign, status: campaign.status || "recruiting" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-campaigns"] });
    },
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExternalCampaign> }) => {
      const { data, error } = await supabase.from("campaigns").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-campaigns"] });
      qc.invalidateQueries({ queryKey: ["ext-campaign"] });
    },
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-campaigns"] });
    },
  });
}
