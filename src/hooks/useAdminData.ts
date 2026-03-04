import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function adminInvoke(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-manage-data", {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.data;
}

// ---- Campaigns ----

export function useAdminUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      return adminInvoke("update_campaign", { id, updates });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-campaigns"] });
      qc.invalidateQueries({ queryKey: ["ext-campaign"] });
    },
  });
}

export function useAdminDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return adminInvoke("delete_campaign", { id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-campaigns"] });
    },
  });
}

// ---- Applications ----

export function useAdminApplications(filters?: { companyId?: string; campaignId?: string; statuses?: string[] }) {
  return useQuery({
    queryKey: ["admin-applications", filters],
    queryFn: async () => {
      return adminInvoke("get_applications", {
        companyId: filters?.companyId,
        campaignId: filters?.campaignId,
        statuses: filters?.statuses,
      });
    },
  });
}

export function useAdminUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return adminInvoke("update_application", { id, status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["ext-applications"] });
    },
  });
}

// ---- Companies ----

export function useAdminUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      return adminInvoke("update_company", { id, updates });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-companies"] });
      qc.invalidateQueries({ queryKey: ["ext-company"] });
    },
  });
}

export function useAdminDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return adminInvoke("delete_company", { id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ext-companies"] });
    },
  });
}
