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

export function useBankAccount() {
  return useQuery({
    queryKey: ["bank-account"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as BankAccount | null;
    },
  });
}

export function useUpsertBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (account: Omit<BankAccount, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      // Try update first, then insert
      const { data: existing } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (existing) {
        const { data, error } = await supabase
          .from("bank_accounts")
          .update(account)
          .eq("user_id", session.user.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("bank_accounts")
          .insert({ ...account, user_id: session.user.id })
          .select()
          .single();
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*, campaigns(id, title), companies(id, name)")
        .eq("influencer_user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
  });
}
