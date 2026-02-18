import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export default function LineCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = sessionStorage.getItem("line_oauth_state");

    if (!code) {
      setError("認証コードが見つかりません");
      return;
    }

    if (state !== savedState) {
      setError("認証状態が一致しません。もう一度お試しください。");
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirect_uri = `${window.location.origin}/auth/line/callback`;

        const res = await fetch(
          `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/line-auth`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, redirect_uri }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "認証に失敗しました");
          return;
        }

        // Use line-auth response directly (it queries with service role key, bypassing RLS)
        if (!data.isNewUser && data.user) {
          // Existing user - store session and go to dashboard
          const existing = data.user;
          const mockUser = {
            id: existing.id,
            lastName: existing.name?.split(" ")[0] || existing.name || "",
            firstName: existing.name?.split(" ")[1] || "",
            name: existing.name || "",
            email: "",
            profileImagePreview:
              existing.image_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(existing.name || "")}&background=FFD6E8&color=333`,
            type: "influencer",
          };
          sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
          navigate("/mypage");
          return;
        }

        // New user - go to registration
        const lineProfile = data.lineProfile || {
          userId: data.user?.line_user_id,
          displayName: data.user?.name,
          pictureUrl: data.user?.image_url,
        };
        sessionStorage.setItem("lineProfile", JSON.stringify(lineProfile));
        navigate("/auth/register/add-friend");
      } catch {
        setError("通信エラーが発生しました");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <button
            onClick={() => navigate("/auth/login")}
            className="text-primary underline text-sm"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">LINE認証中...</p>
      </div>
    </div>
  );
}
