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
  } catch {
    // noop
  }

  return null;
}

function isSnsRegistered(profile: any) {
  if (!profile) return { hasInstagram: false, hasTwitter: false };

  return {
    hasInstagram: !!(profile.instagram_url || (profile.instagram_followers || 0) > 0),
    hasTwitter: !!(profile.twitter_url || (profile.twitter_followers || 0) > 0),
  };
}

export function useInfluencerReadiness(): ReadinessResult {
  const profileIdForKey = getInfluencerProfileId();

  const { data, isLoading } = useQuery({
    queryKey: ["influencer-readiness", profileIdForKey],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const profileId = getInfluencerProfileId();
      const userId = session?.user?.id ?? null;

      const lookupIds = Array.from(new Set([profileId, userId].filter(Boolean) as string[]));

      let hasBankAccount = false;
      let hasInstagram = false;
      let hasTwitter = false;

      // 1) Bank account check (direct query first)
      if (lookupIds.length > 0) {
        const { data: banks } = await supabase
          .from("bank_accounts")
          .select("user_id, bank_name, account_number, account_holder")
          .in("user_id", lookupIds);

        const matchedBank =
          banks?.find((b) => profileId && b.user_id === profileId) ??
          banks?.find((b) => userId && b.user_id === userId) ??
          banks?.[0] ??
          null;

        hasBankAccount = !!(
          matchedBank &&
          matchedBank.bank_name &&
          matchedBank.account_number &&
          matchedBank.account_holder
        );
      }

      // 2) Bank account fallback for LINE flow / legacy mixed IDs
      if (!hasBankAccount && profileId) {
        const { data: bankData } = await supabase.functions.invoke("get-my-bank-account", {
          body: { influencerProfileId: profileId },
        });

        const bank = bankData?.data;
        hasBankAccount = !!(bank && bank.bank_name && bank.account_number && bank.account_holder);
      }

      // 3) SNS check with robust fallback (id / user_id の両軸)
      if (lookupIds.length > 0) {
        const orFilter = lookupIds
          .flatMap((id) => [`id.eq.${id}`, `user_id.eq.${id}`])
          .join(",");

        const { data: profiles } = await supabase
          .from("influencer_profiles")
          .select("id, user_id, instagram_url, twitter_url, instagram_followers, twitter_followers")
          .or(orFilter)
          .limit(10);

        const profile =
          profiles?.find((p) => profileId && p.id === profileId) ??
          profiles?.find((p) => userId && p.user_id === userId) ??
          profiles?.[0] ??
          null;

        const sns = isSnsRegistered(profile);
        hasInstagram = sns.hasInstagram;
        hasTwitter = sns.hasTwitter;
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