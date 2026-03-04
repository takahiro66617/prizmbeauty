import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const LINE_FRIEND_ADD_URL = "https://line.me/R/ti/p/@616jfxwh";

export default function LineCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = localStorage.getItem("line_oauth_state");

    if (!code) {
      setError("認証コードが見つかりません");
      return;
    }

    const isLiffEnvironment = !savedState || navigator.userAgent.includes("Line");
    if (!isLiffEnvironment && state !== savedState) {
      setError("認証状態が一致しません。もう一度お試しください。");
      return;
    }
    if (savedState) {
      localStorage.removeItem("line_oauth_state");
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
          const message = String(data?.error || "認証に失敗しました");
          const isFriendRequirementError =
            message.includes("フレンド") ||
            message.includes("友だち") ||
            message.toLowerCase().includes("friend");

          if (isFriendRequirementError) {
            sessionStorage.setItem("lineFriendStatus", "not_added");
            window.location.replace(LINE_FRIEND_ADD_URL);
            return;
          }

          setError(message);
          return;
        }

        // 友だち追加は必須: 未追加時はLINE友だち追加画面へ遷移
        if (data.friendFlag !== true) {
          sessionStorage.setItem("lineFriendStatus", "not_added");
          window.location.replace(LINE_FRIEND_ADD_URL);
          return;
        }

        sessionStorage.setItem("lineFriendStatus", "added");

        // Use line-auth response directly (it queries with service role key, bypassing RLS)
        if (!data.isNewUser && data.user) {
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

        // Proceed to profile registration
        const lineProfile = data.lineProfile || {
          userId: data.user?.line_user_id,
          displayName: data.user?.name,
          pictureUrl: data.user?.image_url,
        };
        sessionStorage.setItem("lineProfile", JSON.stringify(lineProfile));
        navigate("/auth/register/profile");
      } catch {
        setError("通信エラーが発生しました");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-destructive font-medium whitespace-pre-line">{error}</p>
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
