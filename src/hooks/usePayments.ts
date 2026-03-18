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

// Unified helper: resolve influencer profile ID from all sources
function getInfluencerProfileId(): string | null {
  try {
    // Priority 1: sessionStorage currentUser (used by LINE login flow)
    const currentUser = sessionStorage.getItem("currentUser");
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.id) return parsed.id;
    }
    // Priority 2: localStorage line_user (legacy fallback)
    const lineUser = localStorage.getItem("line_user");
    if (lineUser) {
      const parsed = JSON.parse(lineUser);
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
      const profileId = getInfluencerProfileId();
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
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;
      const profileId = getInfluencerProfileId();

      // Auth user path: always use session.user.id (matches RLS: user_id = auth.uid())
      if (userId) {
        const { data: existing } = await supabase
          .from("bank_accounts")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (existing) {
          const { data, error } = await supabase
            .from("bank_accounts")
            .update(account)
            .eq("user_id", userId)
            .select()
            .single();
          if (error) {
            console.error("Bank account update error (auth user):", error);
            throw error;
          }
          return data;
        } else {
          const { data, error } = await supabase
            .from("bank_accounts")
            .insert({ ...account, user_id: userId })
            .select()
            .single();
          if (error) {
            console.error("Bank account insert error (auth user):", error);
            throw error;
          }
          return data;
        }
      }

      // LINE user path (no auth session): use edge function
      if (profileId) {
        const { data: res, error } = await supabase.functions.invoke("upsert-my-bank-account", {
          body: { influencerProfileId: profileId, ...account },
        });
        if (error) {
          console.error("Bank account upsert error (LINE user):", error);
          throw error;
        }
        if (res?.error) throw new Error(res.error);
        return res?.data;
      }

      throw new Error("認証情報が見つかりません。再ログインしてください。");
    },
    onSuccess: () => {
      // Invalidate both caches so bank account display AND readiness banner update immediately
      qc.invalidateQueries({ queryKey: ["bank-account"] });
      qc.invalidateQueries({ queryKey: ["influencer-readiness"] });
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
      const profileId = getInfluencerProfileId();
      if (!profileId) return [];

      const { data: res, error } = await supabase.functions.invoke("get-my-payments", {
        body: { influencerProfileId: profileId },
      });
      if (error) throw error;
      return (res?.data as Payment[]) ?? [];
    },
  });
}
