import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReadinessResult {
  hasBankAccount: boolean;
  hasSnsInfo: boolean;
  isReady: boolean;
  isLoading: boolean;
  missingItems: string[];
}

export function useInfluencerReadiness(): ReadinessResult {
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [hasSnsInfo, setHasSnsInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      setIsLoading(true);
      try {
        // Get user ID
        const { data: { session } } = await supabase.auth.getSession();
        const stored = sessionStorage.getItem("currentUser");
        const profileId = stored ? JSON.parse(stored).id : null;
        const userId = session?.user?.id;

        // Check bank account
        if (userId) {
          const { data: bankData } = await supabase.functions.invoke("get-my-bank-account", {
            body: { userId },
          });
          const bank = bankData?.data;
          setHasBankAccount(!!(bank && bank.bank_name && bank.account_number && bank.account_holder));
        } else {
          // LINE-auth user: try via edge function
          const lineUser = localStorage.getItem("line_user");
          if (lineUser) {
            const parsed = JSON.parse(lineUser);
            const uid = parsed.influencerProfileId || parsed.id;
            if (uid) {
              const { data: bankData } = await supabase.functions.invoke("get-my-bank-account", {
                body: { userId: uid },
              });
              const bank = bankData?.data;
              setHasBankAccount(!!(bank && bank.bank_name && bank.account_number && bank.account_holder));
            }
          }
        }

        // Check SNS info from influencer profile
        if (userId) {
          const { data: profile } = await supabase
            .from("influencer_profiles")
            .select("instagram_url, tiktok_url, youtube_url, twitter_url, instagram_followers, tiktok_followers, youtube_followers, twitter_followers")
            .eq("user_id", userId)
            .maybeSingle();
          if (profile) {
            const hasAnySnsUrl = !!(profile.instagram_url || profile.tiktok_url || profile.youtube_url || profile.twitter_url);
            const hasAnyFollowers = (profile.instagram_followers || 0) > 0 || (profile.tiktok_followers || 0) > 0 || (profile.youtube_followers || 0) > 0 || (profile.twitter_followers || 0) > 0;
            setHasSnsInfo(hasAnySnsUrl || hasAnyFollowers);
          }
        } else if (profileId) {
          const { data: profile } = await supabase
            .from("influencer_profiles")
            .select("instagram_url, tiktok_url, youtube_url, twitter_url, instagram_followers, tiktok_followers, youtube_followers, twitter_followers")
            .eq("id", profileId)
            .maybeSingle();
          if (profile) {
            const hasAnySnsUrl = !!(profile.instagram_url || profile.tiktok_url || profile.youtube_url || profile.twitter_url);
            const hasAnyFollowers = (profile.instagram_followers || 0) > 0 || (profile.tiktok_followers || 0) > 0 || (profile.youtube_followers || 0) > 0 || (profile.twitter_followers || 0) > 0;
            setHasSnsInfo(hasAnySnsUrl || hasAnyFollowers);
          }
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
  if (!hasSnsInfo) missingItems.push("SNSアカウント情報");

  return {
    hasBankAccount,
    hasSnsInfo,
    isReady: hasBankAccount && hasSnsInfo,
    isLoading,
    missingItems,
  };
}
