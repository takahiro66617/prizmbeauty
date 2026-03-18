import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReadinessResult {
  hasBankAccount: boolean;
  hasInstagram: boolean;
  hasTwitter: boolean;
  isReady: boolean;
  isLoading: boolean;
  missingItems: string[];
}

export function useInfluencerReadiness(): ReadinessResult {
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [hasInstagram, setHasInstagram] = useState(false);
  const [hasTwitter, setHasTwitter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const stored = sessionStorage.getItem("currentUser");
        const profileId = stored ? JSON.parse(stored).id : null;
        const userId = session?.user?.id;

        // Check bank account
        if (userId) {
          // Auth user: query directly via supabase client (matches RLS user_id = auth.uid())
          const { data: bank } = await supabase
            .from("bank_accounts")
            .select("bank_name, account_number, account_holder")
            .eq("user_id", userId)
            .maybeSingle();
          setHasBankAccount(!!(bank && bank.bank_name && bank.account_number && bank.account_holder));
        } else {
          // LINE user: use edge function with correct param name
          const lineUser = localStorage.getItem("line_user");
          if (lineUser) {
            const parsed = JSON.parse(lineUser);
            const uid = parsed.influencerProfileId || parsed.id;
            if (uid) {
              const { data: bankData } = await supabase.functions.invoke("get-my-bank-account", {
                body: { influencerProfileId: uid },
              });
              const bank = bankData?.data;
              setHasBankAccount(!!(bank && bank.bank_name && bank.account_number && bank.account_holder));
            }
          }
        }

        // Check SNS info (Instagram & X individually)
        const checkSns = (profile: any) => {
          if (profile) {
            setHasInstagram(!!(profile.instagram_url || (profile.instagram_followers || 0) > 0));
            setHasTwitter(!!(profile.twitter_url || (profile.twitter_followers || 0) > 0));
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
      } catch (e) {
        console.error("Readiness check error:", e);
      }
      setIsLoading(false);
    };
    check();
  }, []);

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
