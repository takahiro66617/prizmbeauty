import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.png";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError("メールアドレスまたはパスワードが正しくありません。");
        return;
      }
      // Check if user has client role
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", authData.user.id);
      const isClient = roles?.some(r => r.role === "client");
      if (!isClient) {
        setError("企業アカウントではありません。");
        await supabase.auth.signOut();
        return;
      }
      // Get company
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", authData.user.id).single();
      if (company) {
        sessionStorage.setItem("client_session", "true");
        sessionStorage.setItem("client_company_id", company.id);
        sessionStorage.setItem("client_user_id", authData.user.id);
      }
      navigate("/client/dashboard");
    } catch {
      setError("ログインに失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoImg} alt="PRizm" className="h-10 mx-auto mb-2" />
          <p className="text-slate-400 mt-2">企業管理画面ログイン</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" required />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
            {isLoading ? "ログイン中..." : "ログイン"}
          </Button>
          <div className="text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-blue-600">← トップページに戻る</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
