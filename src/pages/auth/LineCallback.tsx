import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export default function LineCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("認証コードが見つかりません");
      return;
    }

    localStorage.removeItem("line_oauth_state");

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

        // Check for pending registration data (new registration flow)
        const pendingReg = localStorage.getItem("pendingRegistration");

        // NEW USER without pending registration (clicked "Login" by mistake)
        // → Skip friendship check entirely, redirect to add-friend page
        if (data.isNewUser && !pendingReg) {
          const lineProfile = data.lineProfile || {
            userId: data.user?.line_user_id,
            displayName: data.user?.name,
            pictureUrl: data.user?.image_url,
          };
          localStorage.setItem("lineProfile", JSON.stringify(lineProfile));
          navigate("/auth/register/add-friend");
          return;
        }

        // Block if not friends with LINE Official Account (existing users & registration finalization)
        if (!data.isFriend) {
          setError("PRizmのLINE公式アカウント（@616jfxwh）を友だち追加してからログインしてください。ログイン画面の同意画面で「友だち追加」にチェックを入れてください。");
          return;
        }

        if (pendingReg && data.isNewUser) {
          // New user with profile data → complete registration
          const profileData = JSON.parse(pendingReg);
          const lineProfile = data.lineProfile || {
            userId: data.user?.line_user_id,
            displayName: data.user?.name,
            pictureUrl: data.user?.image_url,
          };

          const regRes = await fetch(
            `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/register-influencer`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lineProfile: {
                  userId: lineProfile.userId,
                  displayName: lineProfile.displayName,
                  pictureUrl: lineProfile.pictureUrl,
                },
                nickname: profileData.nickname,
                name: profileData.name,
                category: profileData.category,
                bio: profileData.bio || "",
                gender: profileData.gender,
                birthDate: profileData.birthDate,
                prefecture: profileData.prefecture,
              }),
            }
          );

          const regResult = await regRes.json();

          if (!regRes.ok || !regResult.success) {
            console.error("Register error:", regResult);
            setError(regResult.details || "登録に失敗しました。もう一度お試しください。");
            return;
          }

          const regData = regResult.data;
          const mockUser = {
            id: regData.id,
            lastName: profileData.lastName,
            firstName: profileData.firstName,
            name: profileData.name,
            email: "",
            profileImagePreview:
              lineProfile.pictureUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.lastName)}&background=FFD6E8&color=333`,
            type: "influencer",
          };
          sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
          localStorage.removeItem("pendingRegistration");
          localStorage.removeItem("lineFriendAdded");
          localStorage.removeItem("lineProfile");
          navigate("/mypage");
          return;
        }

        // Existing user login (or new user without pending data — fallback)
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
          localStorage.removeItem("pendingRegistration");
          localStorage.removeItem("lineFriendAdded");
          navigate("/mypage");
          return;
        }

        // Fallback: unexpected state
        setError("予期しないエラーが発生しました。もう一度お試しください。");
      } catch {
        setError("通信エラーが発生しました");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  if (error) {
    const isFriendshipError = error.includes("友だち追加");
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          {isFriendshipError ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">友だち追加が必要です</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  PRizmをご利用いただくには、LINE公式アカウントの友だち追加が必須です。
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-left space-y-2">
                <p className="text-sm font-semibold text-foreground">手順：</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>下のボタンからもう一度ログイン</li>
                  <li>LINEの同意画面で<span className="font-bold text-foreground">「友だち追加」にチェック</span>を入れる</li>
                  <li>「許可する」をタップ</li>
                </ol>
              </div>
              <button
                onClick={() => navigate("/auth/login")}
                className="w-full h-12 rounded-full text-base font-bold text-white shadow-md"
                style={{ backgroundColor: "#06C755" }}
              >
                もう一度LINEでログインする
              </button>
            </>
          ) : (
            <>
              <p className="text-destructive font-medium">{error}</p>
              <button
                onClick={() => navigate("/auth/login")}
                className="text-primary underline text-sm"
              >
                ログインページに戻る
              </button>
            </>
          )}
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
