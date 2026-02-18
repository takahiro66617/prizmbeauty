import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: "client", company_name: companyName, display_name: contactName },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      navigate("/client/dashboard");
    } else {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        setLoading(false);
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "client")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        setError("企業アカウントではありません。");
        setLoading(false);
        return;
      }

      navigate("/client/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">PRizm Client</h1>
          <p className="text-slate-400 mt-2">{isRegister ? "企業アカウント新規登録" : "企業管理画面ログイン"}</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">企業名</label>
                <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="株式会社〇〇" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">担当者名</label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="山田 太郎" required />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@company.co.jp" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" required minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "処理中..." : isRegister ? "登録する" : "ログイン"}
          </Button>
          <div className="text-center space-y-2">
            <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-sm text-blue-600 hover:underline">
              {isRegister ? "すでにアカウントをお持ちの方はこちら" : "新規登録はこちら"}
            </button>
            <div>
              <Link to="/" className="text-sm text-gray-500 hover:text-blue-600">← トップページに戻る</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
