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

export function useAdminCampaigns(filters?: { companyId?: string; statuses?: string[] }) {
  return useQuery({
    queryKey: ["admin-campaigns", filters],
    queryFn: async () => {
      return adminInvoke("get_campaigns", {
        companyId: filters?.companyId,
        statuses: filters?.statuses,
      });
    },
  });
}

// ---- Debug Reports ----

export function useAdminDebugReports(filters?: { status?: string }) {
  return useQuery({
    queryKey: ["admin-debug-reports", filters],
    queryFn: async () => {
      return adminInvoke("get_debug_reports", {
        status: filters?.status,
      });
    },
  });
}

export function useAdminUpdateDebugReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return adminInvoke("update_debug_report_status", { id, status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-debug-reports"] });
    },
  });
}

// ---- Campaigns ----

export function useAdminUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      return adminInvoke("update_campaign", { id, updates });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
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
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
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

// ---- Admin Notifications ----

export function useAdminSendNotification() {
  return useMutation({
    mutationFn: async (params: {
      targetType: "influencer" | "company" | "all_influencers" | "all_companies" | "all";
      targetIds?: string[];
      title: string;
      message: string;
      type?: string;
      link?: string;
    }) => {
      return adminInvoke("send_admin_notification", params);
    },
  });
}
