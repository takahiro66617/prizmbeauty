import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "influencer")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      setError("インフルエンサーアカウントではありません");
      setLoading(false);
      return;
    }

    navigate("/mypage");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-pink/30 via-card to-pastel-blue/30 p-4">
      <div className="w-full max-w-sm space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> トップに戻る
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">PRizm Beauty</h1>
          <p className="text-muted-foreground text-sm">インフルエンサーログイン</p>
        </div>

        <Card className="p-8 shadow-xl border-0 bg-card/90 backdrop-blur-sm rounded-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-center space-y-1 mb-6">
              <h2 className="font-bold">おかえりなさい！</h2>
              <p className="text-xs text-muted-foreground">アカウントにログインして<br />新しい案件を見つけましょう</p>
            </div>

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">メールアドレス</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">パスワード</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" required />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold" variant="gradient">
              {loading ? "認証中..." : "ログイン"}
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground">
            ログインすることで、<Link to="/terms" className="underline">利用規約</Link>および<Link to="/privacy" className="underline">プライバシーポリシー</Link>に同意したものとみなされます。
          </p>
          <p className="text-sm text-muted-foreground pt-4 border-t border-border">
            アカウントをお持ちでないですか？<br />
            <Link to="/register" className="font-bold text-primary hover:underline mt-1 inline-block">新規登録はこちら</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
