import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  branch_name: string;
  account_type: string;
  account_number: string;
  account_holder: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  application_id: string;
  influencer_user_id: string;
  company_id: string;
  campaign_id: string;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  campaigns?: { id: string; title: string } | null;
  companies?: { id: string; name: string } | null;
}

// Helper to get LINE influencer profile ID from localStorage
function getLineInfluencerProfileId(): string | null {
  try {
    const stored = localStorage.getItem("line_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.influencerProfileId || parsed.id || null;
    }
  } catch {}
  return null;
}

export function useBankAccount() {
  return useQuery({
    queryKey: ["bank-account"],
    queryFn: async () => {
      // Try auth session first
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from("bank_accounts")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (error) throw error;
        return data as BankAccount | null;
      }

      // LINE user fallback
      const profileId = getLineInfluencerProfileId();
      if (!profileId) return null;

      const { data: res, error } = await supabase.functions.invoke("get-my-bank-account", {
        body: { influencerProfileId: profileId },
      });
      if (error) throw error;
      return (res?.data as BankAccount | null) ?? null;
    },
  });
}

export function useUpsertBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (account: Omit<BankAccount, "id" | "created_at" | "updated_at" | "user_id">) => {
      // Try auth session first
      const { data: { session } } = await supabase.auth.getSession();
      
      // Determine user ID: auth session or LINE user
      let userId: string | null = session?.user?.id ?? null;
      const profileId = getLineInfluencerProfileId();

      // For LINE users without auth session, use edge function
      if (!userId && profileId) {
        console.log("[bank-upsert] Using edge function for LINE user, profileId:", profileId);
        const { data: res, error } = await supabase.functions.invoke("upsert-my-bank-account", {
          body: { influencerProfileId: profileId, ...account },
        });
        console.log("[bank-upsert] Edge function result:", res, "error:", error);
        if (error) throw error;
        if (res?.error) throw new Error(res.error);
        return res?.data;
      }

      // For auth users, also check if their influencer profile ID should be used as user_id
      // (bank_accounts.user_id may reference influencer_profiles.id for LINE-registered users)
      if (!userId && !profileId) throw new Error("Not authenticated");

      // Auth user path: use influencer profile id if available, otherwise auth user id
      const bankUserId = profileId || userId!;
      console.log("[bank-upsert] Auth path, bankUserId:", bankUserId, "authUserId:", userId, "profileId:", profileId);

      const { data: existing } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("user_id", bankUserId)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from("bank_accounts")
          .update(account)
          .eq("user_id", bankUserId)
          .select()
          .single();
        console.log("[bank-upsert] Update result:", data, "error:", error);
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("bank_accounts")
          .insert({ ...account, user_id: bankUserId })
          .select()
          .single();
        console.log("[bank-upsert] Insert result:", data, "error:", error);
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bank-account"] });
    },
  });
}

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      // Try auth session first
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from("payments")
          .select("*, campaigns(id, title), companies(id, name)")
          .eq("influencer_user_id", session.user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as Payment[];
      }

      // LINE user fallback
      const profileId = getLineInfluencerProfileId();
      if (!profileId) return [];

      const { data: res, error } = await supabase.functions.invoke("get-my-payments", {
        body: { influencerProfileId: profileId },
      });
      if (error) throw error;
      return (res?.data as Payment[]) ?? [];
    },
  });
}
