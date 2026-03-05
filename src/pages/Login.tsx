import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import lineIcon from "@/assets/line.png";
import logoImg from "@/assets/logo.png";
import { buildLineOAuthUrl } from "@/lib/lineAuth";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLineLogin = () => {
    // Clear stale registration session data to prevent mis-routing
    localStorage.removeItem("pendingRegistration");
    localStorage.removeItem("lineFriendAdded");
    localStorage.removeItem("lineProfile");
    window.location.href = buildLineOAuthUrl();
  };

  const handleRegister = () => {
    navigate("/auth/register/add-friend");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-pink/30 via-card to-pastel-blue/30 p-4">
      <div className="w-full max-w-sm space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> トップに戻る
        </Link>

        <div className="text-center space-y-2">
          <img src={logoImg} alt="PRizm" className="h-14 mx-auto" />
          <p className="text-muted-foreground text-sm">インフルエンサー向け</p>
        </div>

        <Card className="p-8 shadow-xl border-0 bg-card/90 backdrop-blur-sm rounded-2xl">
          <div className="space-y-6">
            <div className="text-center space-y-1 mb-6">
              <h2 className="font-bold text-lg">ログイン / 新規登録</h2>
              <p className="text-xs text-muted-foreground">LINEアカウントで簡単にご利用いただけます</p>
            </div>

            {/* Login — existing users go straight to OAuth */}
            <Button onClick={handleLineLogin} className="w-full h-12 text-base font-bold text-white shadow-md" style={{ backgroundColor: "#06C755" }}>
              <img src={lineIcon} alt="LINE" className="w-6 h-6" />
              LINEでログイン
            </Button>

            {/* Register — new users go to add-friend page first */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">はじめての方</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button onClick={handleRegister} variant="outline" className="w-full h-12 text-base font-bold border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10">
              <img src={lineIcon} alt="LINE" className="w-6 h-6" />
              LINEで新規登録
            </Button>
          </div>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground">
            ログインすることで、<Link to="/terms" className="underline">利用規約</Link>および<Link to="/privacy" className="underline">プライバシーポリシー</Link>に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}
