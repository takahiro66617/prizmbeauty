import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import HelpGuideModal from "@/components/admin/HelpGuideModal";
import { useAdminApplications } from "@/hooks/useAdminData";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { APPLICATION_STATUSES, CATEGORIES } from "@/lib/constants";

export default function AdminApplications() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: applications = [], isLoading } = useAdminApplications();
  const { data: campaigns = [] } = useExternalCampaigns();
  const { data: companies = [] } = useExternalCompanies();

  const filtered = applications.filter((a: any) => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesSearch = !search || (a.influencer_profiles?.name || "").toLowerCase().includes(search.toLowerCase()) || (a.campaigns?.title || "").toLowerCase().includes(search.toLowerCase());
    const matchesCompany = companyFilter === "all" || a.campaigns?.companies?.id === companyFilter;
    const matchesCampaign = campaignFilter === "all" || a.campaign_id === campaignFilter;
    const matchesCategory = categoryFilter === "all" || a.campaigns?.category === categoryFilter;
    const matchesDateFrom = !dateFrom || new Date(a.applied_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(a.applied_at) <= new Date(dateTo + "T23:59:59");
    return matchesStatus && matchesSearch && matchesCompany && matchesCampaign && matchesCategory && matchesDateFrom && matchesDateTo;
  });

  const getStatusBadge = (status: string) => {
    const s = APPLICATION_STATUSES.find(x => x.id === status);
    return <Badge className={s?.color || ""}>{s?.label || status}</Badge>;
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setCompanyFilter("all"); setCampaignFilter("all");
    setCategoryFilter("all"); setDateFrom(""); setDateTo("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">応募管理</h1>
          <p className="text-gray-500 mt-1">全応募の横断一覧です。行クリックで詳細ページへ。</p>
        </div>
        <HelpGuideModal
          title="応募管理の使い方"
          description="インフルエンサーからの応募を一元管理し、選考・ステータス変更を行います。"
          sections={[
            { title: "応募一覧", content: ["全案件への応募を横断的に確認", "企業・案件・ステータス・カテゴリ・期間で絞り込み"] },
            { title: "詳細ページ", content: ["行をクリックで応募詳細ページへ移動", "IF情報・案件情報・ステータス変更を専用ページで実行"] },
          ]}
          workflow={["新規応募を確認", "行クリックで詳細ページへ", "ステータスを変更"]}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="IF名・案件名で検索..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">ステータス: すべて</option>
              {APPLICATION_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">企業: すべて</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">案件: すべて</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">カテゴリ: すべて</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>応募日:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
              <span>〜</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">フィルターをクリア</Button>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">IF名</th>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">企業</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">応募日</th>
              <th className="px-6 py-4">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filtered.length > 0 ? filtered.map((app: any) => (
              <tr key={app.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/applications/${app.id}`)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {app.influencer_profiles && <img src={app.influencer_profiles.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.influencer_profiles.name)}`} alt="" className="w-7 h-7 rounded-full" />}
                    <div>
                      <span className="font-medium text-gray-900">{app.influencer_profiles?.name || "-"}</span>
                      <p className="text-xs text-gray-400">@{app.influencer_profiles?.username || ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {app.campaigns?.image_url ? (
                      <img src={app.campaigns.image_url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0"><span className="text-xs text-gray-400">📋</span></div>
                    )}
                    <span className="text-gray-700">{app.campaigns?.title || "-"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{app.campaigns?.companies?.name || "-"}</td>
                <td className="px-6 py-4"><Badge variant="outline" className="text-xs">{app.campaigns?.category || "-"}</Badge></td>
                <td className="px-6 py-4 text-gray-500">{new Date(app.applied_at).toLocaleDateString("ja-JP")}</td>
                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">応募がありません</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>
    </div>
  );
}
