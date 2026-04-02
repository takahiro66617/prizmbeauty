import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, User, Calendar, X, Trash2, Ban, CheckCircle } from "lucide-react";
import HelpGuideModal from "@/components/admin/HelpGuideModal";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useAdminApplications, useAdminDeleteCompany, useAdminUpdateCompany } from "@/hooks/useAdminData";
import { COMPANY_STATUSES, INDUSTRIES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ email: "", password: "", company_name: "", contact_name: "", industry: "", phone: "", website: "", description: "" });
  const [regLoading, setRegLoading] = useState(false);

  const { data: companies = [], isLoading, refetch } = useExternalCompanies();
  const { data: campaigns = [] } = useExternalCampaigns();
  const { data: applications = [] } = useAdminApplications();
  const deleteCompany = useAdminDeleteCompany();
  const updateCompany = useAdminUpdateCompany();

  const handleStatusChange = (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const label = newStatus === "suspended" ? "利用停止" : "利用再開";
    if (!window.confirm(`この企業を${label}しますか？`)) return;
    updateCompany.mutate({ id, updates: { status: newStatus } }, {
      onSuccess: () => { toast.success(`${label}しました`); refetch(); },
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  const filtered = companies.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.contact_name || "").toLowerCase().includes(search.toLowerCase()) || (c.contact_email || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesIndustry = industryFilter === "all" || c.industry === industryFilter;
    const matchesDateFrom = !dateFrom || new Date(c.created_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(c.created_at) <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesStatus && matchesIndustry && matchesDateFrom && matchesDateTo;
  });

  const handleDelete = (id: string) => {
    if (!window.confirm("この企業を削除しますか？")) return;
    deleteCompany.mutate(id, {
      onSuccess: () => { toast.success("削除しました"); refetch(); },
      onError: () => toast.error("削除に失敗しました"),
    });
  };

  const handleRegister = async () => {
    if (!regForm.email || !regForm.password || !regForm.company_name) {
      toast.error("メールアドレス、パスワード、企業名は必須です");
      return;
    }
    if (regForm.phone && !/^[\d\-+()]{10,15}$/.test(regForm.phone)) {
      toast.error("正しい電話番号を入力してください");
      return;
    }
    setRegLoading(true);
    try {
      const res = await supabase.functions.invoke("register-client", {
        body: {
          email: regForm.email, password: regForm.password, company_name: regForm.company_name,
          display_name: regForm.contact_name || regForm.company_name,
          contact_name: regForm.contact_name || null, industry: regForm.industry || null,
          phone: regForm.phone || null, website: regForm.website || null, description: regForm.description || null,
        },
      });
      if (res.error) throw res.error;
      const data = res.data as any;
      if (data?.error) { toast.error(data.error); return; }
      toast.success("企業アカウントを作成しました");
      setShowRegister(false);
      setRegForm({ email: "", password: "", company_name: "", contact_name: "", industry: "", phone: "", website: "", description: "" });
      refetch();
    } catch (e: any) {
      toast.error("作成に失敗しました: " + (e.message || ""));
    } finally { setRegLoading(false); }
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setIndustryFilter("all"); setDateFrom(""); setDateTo(""); };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-gray-500 mt-1">登録済みの企業一覧です。新規アカウント発行・編集を行えます。</p>
        </div>
        <HelpGuideModal title="企業管理の使い方" description="登録企業のアカウント管理・情報編集・認証情報の変更を行います。"
          sections={[
            { title: "企業アカウント発行", content: ["「＋新規企業登録」ボタンで企業アカウントを作成", "メールアドレス・パスワード・企業名を入力して発行"] },
            { title: "企業情報編集", content: ["企業名クリックで詳細ページを開き編集", "業種・連絡先等を管理"] },
            { title: "認証情報管理", content: ["詳細ページでログイン情報を確認・変更"] },
          ]}
          workflow={["新規企業の問い合わせを受けアカウントを発行", "企業がログインして案件を作成", "事務局で案件内容を確認し承認"]}
        />
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowRegister(true)}>
          <Plus className="w-4 h-4 mr-2" />新規企業アカウント発行
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="企業名・担当者名・メールで検索..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">ステータス: すべて</option>
              {COMPANY_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">業種: すべて</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>登録日:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
              <span>〜</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">フィルターをクリア</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">企業</th>
                <th className="px-6 py-3">担当者</th>
                <th className="px-6 py-3">業種</th>
                <th className="px-6 py-3">案件数</th>
                <th className="px-6 py-3">応募数</th>
                <th className="px-6 py-3">登録日</th>
                <th className="px-6 py-3">ステータス</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
              ) : filtered.length > 0 ? filtered.map(company => {
                const companyCampaigns = campaigns.filter(c => c.company_id === company.id);
                const companyApps = applications.filter(a => a.company_id === company.id);
                const st = COMPANY_STATUSES.find(s => s.id === company.status);
                return (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/clients/${company.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Building2 className="w-5 h-5" /></div>
                        <div className="font-bold text-gray-900">{company.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{company.contact_name || "-"}</div>
                          <div className="text-xs text-gray-500">{company.contact_email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{company.industry || "-"}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{companyCampaigns.length}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{companyApps.length}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{new Date(company.created_at).toLocaleDateString("ja-JP")}</div>
                    </td>
                    <td className="px-6 py-4"><Badge className={st?.color || ""}>{st?.label || company.status}</Badge></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-1 justify-end" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => navigate(`/admin/clients/${company.id}`)}>詳細</Button>
                        {company.status !== "suspended" ? (
                          <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-700 hover:bg-orange-50" onClick={(e) => handleStatusChange(company.id, "suspended", e)}>
                            <Ban className="w-3 h-3 mr-1" />停止
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={(e) => handleStatusChange(company.id, "active", e)}>
                            <CheckCircle className="w-3 h-3 mr-1" />再開
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(company.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">企業がありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>

      {/* Register New Company Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowRegister(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">新規企業アカウント発行</h3>
              <button onClick={() => setShowRegister(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                企業アカウントを作成します。作成後、企業管理画面（/client/login）からログインできます。
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス *</label>
                <Input type="email" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} placeholder="email@company.com" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">パスワード *</label>
                <Input type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} placeholder="8文字以上" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">企業名 *</label>
                <Input value={regForm.company_name} onChange={e => setRegForm({ ...regForm, company_name: e.target.value })} placeholder="株式会社〇〇" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label>
                <Input value={regForm.contact_name} onChange={e => setRegForm({ ...regForm, contact_name: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">業種</label>
                <select value={regForm.industry} onChange={e => setRegForm({ ...regForm, industry: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">未選択</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                  <Input value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value.replace(/[^\d\-+()]/g, "") })} placeholder="03-1234-5678" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Webサイト</label>
                  <Input value={regForm.website} onChange={e => setRegForm({ ...regForm, website: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">概要</label>
                <textarea value={regForm.description} onChange={e => setRegForm({ ...regForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[60px]" /></div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRegister(false)}>キャンセル</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleRegister} disabled={regLoading}>
                {regLoading ? "作成中..." : "アカウント作成"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
