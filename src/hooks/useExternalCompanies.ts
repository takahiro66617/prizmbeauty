import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseExternal } from "@/lib/supabaseExternal";

export interface ExternalCompany {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  industry: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useExternalCompanies() {
  return useQuery({
    queryKey: ["ext-companies"],
    queryFn: async () => {
      const { data, error } = await supabaseExternal.from("companies").select("*");
      if (error) throw error;
      return data as ExternalCompany[];
    },
  });
}

export function useExternalCompany(companyId: string | null) {
  return useQuery({
    queryKey: ["ext-company", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabaseExternal.from("companies").select("*").eq("id", companyId).single();
      if (error) throw error;
      return data as ExternalCompany;
    },
    enabled: !!companyId,
  });
}

export function useExternalCompanyByEmail(email: string | null) {
  return useQuery({
    queryKey: ["ext-company-email", email],
    queryFn: async () => {
      if (!email) return null;
      const { data, error } = await supabaseExternal.from("companies").select("*").eq("contact_email", email).single();
      if (error) throw error;
      return data as ExternalCompany;
    },
    enabled: !!email,
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ExternalCompany> }) => {
      const { data, error } = await supabaseExternal.from("companies").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-companies"] });
      qc.invalidateQueries({ queryKey: ["ext-company"] });
    },
  });
}
