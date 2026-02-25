import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import lineIcon from "@/assets/line.png";
import logoImg from "@/assets/logo.png";

const LINE_CHANNEL_ID = "2009141875";

function generateState() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginPage() {
  const handleLineLogin = () => {
    const state = generateState();
    sessionStorage.setItem("line_oauth_state", state);
    const redirectUri = `${window.location.origin}/auth/line/callback`;
    const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-pink/30 via-card to-pastel-blue/30 p-4">
      <div className="w-full max-w-sm space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> トップに戻る
        </Link>

        <div className="text-center space-y-2">
          <img src={logoImg} alt="PRizm" className="h-14 mx-auto" />
          <p className="text-muted-foreground text-sm">インフルエンサーログイン</p>
        </div>

        <Card className="p-8 shadow-xl border-0 bg-card/90 backdrop-blur-sm rounded-2xl">
          <div className="space-y-6">
            <div className="text-center space-y-1 mb-6">
              <h2 className="font-bold">おかえりなさい！</h2>
              <p className="text-xs text-muted-foreground">アカウントにログインして<br />新しい案件を見つけましょう</p>
            </div>

            <Button onClick={handleLineLogin} className="w-full h-12 text-base font-bold text-white shadow-md" style={{ backgroundColor: "#06C755" }}>
              <img src={lineIcon} alt="LINE" className="w-6 h-6" />
              LINEでログイン / 新規登録
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
