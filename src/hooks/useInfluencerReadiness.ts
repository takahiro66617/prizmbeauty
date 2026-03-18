import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReadinessResult {
  hasBankAccount: boolean;
  hasInstagram: boolean;
  hasTwitter: boolean;
  isReady: boolean;
  isLoading: boolean;
  missingItems: string[];
}

// Unified helper matching usePayments.ts
function getInfluencerProfileId(): string | null {
  try {
    const currentUser = sessionStorage.getItem("currentUser");
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.id) return parsed.id;
    }
    const lineUser = localStorage.getItem("line_user");
    if (lineUser) {
      const parsed = JSON.parse(lineUser);
      return parsed.influencerProfileId || parsed.id || null;
    }
  } catch {}
  return null;
}

export function useInfluencerReadiness(): ReadinessResult {
  const { data, isLoading } = useQuery({
    queryKey: ["influencer-readiness"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const profileId = getInfluencerProfileId();
      const userId = session?.user?.id;

      let hasBankAccount = false;
      let hasInstagram = false;
      let hasTwitter = false;

      // Check bank account
      if (userId) {
        const { data: bank } = await supabase
          .from("bank_accounts")
          .select("bank_name, account_number, account_holder")
          .eq("user_id", userId)
          .maybeSingle();
        hasBankAccount = !!(bank && bank.bank_name && bank.account_number && bank.account_holder);
      } else if (profileId) {
        const { data: bankData } = await supabase.functions.invoke("get-my-bank-account", {
          body: { influencerProfileId: profileId },
        });
        const bank = bankData?.data;
        hasBankAccount = !!(bank && bank.bank_name && bank.account_number && bank.account_holder);
      }

      // Check SNS info
      const checkSns = (profile: any) => {
        if (profile) {
          hasInstagram = !!(profile.instagram_url || (profile.instagram_followers || 0) > 0);
          hasTwitter = !!(profile.twitter_url || (profile.twitter_followers || 0) > 0);
        }
      };

      if (userId) {
        const { data: profile } = await supabase
          .from("influencer_profiles")
          .select("instagram_url, twitter_url, instagram_followers, twitter_followers")
          .eq("user_id", userId)
          .maybeSingle();
        checkSns(profile);
      } else if (profileId) {
        const { data: profile } = await supabase
          .from("influencer_profiles")
          .select("instagram_url, twitter_url, instagram_followers, twitter_followers")
          .eq("id", profileId)
          .maybeSingle();
        checkSns(profile);
      }

      return { hasBankAccount, hasInstagram, hasTwitter };
    },
  });

  const hasBankAccount = data?.hasBankAccount ?? false;
  const hasInstagram = data?.hasInstagram ?? false;
  const hasTwitter = data?.hasTwitter ?? false;

  const missingItems: string[] = [];
  if (!hasBankAccount) missingItems.push("振込先口座情報");
  if (!hasInstagram) missingItems.push("Instagramアカウント情報");
  if (!hasTwitter) missingItems.push("X（Twitter）アカウント情報");

  return {
    hasBankAccount,
    hasInstagram,
    hasTwitter,
    isReady: hasBankAccount && hasInstagram && hasTwitter,
    isLoading,
    missingItems,
  };
}
