import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_COMPANIES } from "@/lib/mockData";

const clientAccounts = [
  { email: "yamada@lumiere.co.jp", password: "lumiere123", companyId: "c1" },
  { email: "suzuki@naturalbeauty.jp", password: "natural123", companyId: "c2" },
  { email: "sato@bloom.co.jp", password: "bloom123", companyId: "c3" },
];

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const account = clientAccounts.find(a => a.email === email && a.password === password);
    if (account) {
      sessionStorage.setItem("client_session", "true");
      sessionStorage.setItem("client_company_id", account.companyId);
      navigate("/client/dashboard");
    } else {
      setError("メールアドレスまたはパスワードが正しくありません。");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            PRizm Client
          </h1>
          <p className="text-slate-400 mt-2">企業管理画面ログイン</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="yamada@lumiere.co.jp" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="パスワード" required />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">ログイン</Button>
          <div className="text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-blue-600">← トップページに戻る</Link>
          </div>
          <div className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">テストアカウント:</p>
            <p>yamada@lumiere.co.jp / lumiere123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
