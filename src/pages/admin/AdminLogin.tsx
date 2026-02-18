import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setPassword("");
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      setError("管理者権限がありません");
      setLoading(false);
      return;
    }

    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500 p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">管理画面ログイン</h1>
          <p className="text-sm text-gray-500 mt-2">管理者アカウントでログインしてください</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-gray-50 focus:bg-white" required />
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-gray-50 focus:bg-white" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-pink-200 transition-all active:scale-[0.98]">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "ログイン"}
          </Button>

          <div className="text-center pt-2">
            <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-purple-600 transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              トップページに戻る
            </Link>
          </div>
        </form>
      </Card>
      <p className="mt-8 text-white/60 text-xs">© {new Date().getFullYear()} PRizm Beauty Admin System</p>
    </div>
  );
}
