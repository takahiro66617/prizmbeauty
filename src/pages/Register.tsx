import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { role: "influencer", display_name: form.displayName, username: form.username },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    navigate("/mypage");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-purple/30 via-card to-pastel-pink/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> トップに戻る
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-bold gradient-text mb-2">PRizm Beauty</h1>
          <p className="text-muted-foreground">インフルエンサー新規登録</p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-8 border-0 space-y-6">
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">表示名</label>
              <Input value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder="田中 美咲" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ユーザー名</label>
              <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="misaki_beauty" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">メールアドレス</label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">パスワード</label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="6文字以上" required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} variant="gradient" size="lg" className="w-full">
              {loading ? "登録中..." : "登録する"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{" "}
          <Link to="/auth/login" className="font-bold text-primary hover:underline">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
