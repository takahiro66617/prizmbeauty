import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

        if (data.isNewUser) {
          // Store LINE profile for registration page
          sessionStorage.setItem("lineProfile", JSON.stringify(data.lineProfile));
          navigate("/auth/register/profile");
        } else {
          // Existing user - store session and go to dashboard
          const user = data.user;
          const mockUser = {
            id: user.id,
            lastName: user.name.split(" ")[0] || user.name,
            firstName: user.name.split(" ")[1] || "",
            name: user.name,
            email: "",
            profileImagePreview:
              user.image_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=FFD6E8&color=333`,
            type: "influencer",
          };
          sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
          navigate("/mypage");
        }
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
