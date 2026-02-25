import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple/30 via-card to-pastel-pink/30 p-4">
      <div className="w-full max-w-3xl space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> トップに戻る
        </Link>

        <div className="text-center">
          <img src={logoImg} alt="PRizm" className="h-10 mx-auto mb-2" />
          <p className="text-muted-foreground">インフルエンサー新規登録</p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-8 border-0 space-y-6">
          <p className="text-center text-muted-foreground text-sm">
            登録フォームは準備中です。<br />現在はLINEログインでお試しいただけます。
          </p>
          <div className="flex justify-center">
            <Link to="/auth/login">
              <Button variant="gradient" size="lg">ログインページへ</Button>
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{" "}
          <Link to="/auth/login" className="font-bold text-primary hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
