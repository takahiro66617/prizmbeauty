import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useExternalApplications, useUpdateApplicationStatus } from "@/hooks/useExternalApplications";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { APPLICATION_STATUSES, CATEGORIES, PLATFORMS } from "@/lib/constants";
import { toast } from "sonner";

export default function AdminApplications() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data: applications = [], isLoading } = useExternalApplications();
  const { data: campaigns = [] } = useExternalCampaigns();
  const { data: companies = [] } = useExternalCompanies();
  const updateStatus = useUpdateApplicationStatus();

  const filtered = applications.filter(a => {
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

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => { toast.success("ステータスを更新しました"); setSelectedApp(null); },
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setCompanyFilter("all"); setCampaignFilter("all");
    setCategoryFilter("all"); setDateFrom(""); setDateTo("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">応募管理</h1>
        <p className="text-gray-500 mt-1">全応募の横断一覧です。マッチング状況を確認できます。</p>
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
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filtered.length > 0 ? filtered.map(app => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {app.influencer_profiles && <img src={app.influencer_profiles.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.influencer_profiles.name)}`} alt="" className="w-7 h-7 rounded-full" />}
                    <div>
                      <span className="font-medium text-gray-900">{app.influencer_profiles?.name || "-"}</span>
                      <p className="text-xs text-gray-400">@{app.influencer_profiles?.username || ""}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{app.campaigns?.title || "-"}</td>
                <td className="px-6 py-4 text-gray-600">{app.campaigns?.companies?.name || "-"}</td>
                <td className="px-6 py-4"><Badge variant="outline" className="text-xs">{app.campaigns?.category || "-"}</Badge></td>
                <td className="px-6 py-4 text-gray-500">{new Date(app.applied_at).toLocaleDateString("ja-JP")}</td>
                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800" onClick={() => setSelectedApp(app)}>詳細</Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">応募がありません</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">応募詳細</h3>
              <button onClick={() => setSelectedApp(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {selectedApp.influencer_profiles && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-3">インフルエンサー情報</h4>
                  <div className="flex items-center gap-4">
                    <img src={selectedApp.influencer_profiles.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApp.influencer_profiles.name)}`} alt="" className="w-16 h-16 rounded-full" />
                    <div>
                      <p className="font-bold text-gray-900">{selectedApp.influencer_profiles.name}</p>
                      <p className="text-sm text-gray-500">@{selectedApp.influencer_profiles.username}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedApp.influencer_profiles.category || "未設定"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {[
                      { label: "Instagram", val: selectedApp.influencer_profiles.instagram_followers, color: "text-pink-600" },
                      { label: "TikTok", val: selectedApp.influencer_profiles.tiktok_followers, color: "" },
                      { label: "YouTube", val: selectedApp.influencer_profiles.youtube_followers, color: "text-red-600" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2 bg-white rounded-lg">
                        <p className={`text-xs ${s.color}`}>{s.label}</p>
                        <p className="font-bold">{(s.val || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  {selectedApp.influencer_profiles.bio && <p className="text-sm text-gray-600 mt-3">{selectedApp.influencer_profiles.bio}</p>}
                </div>
              )}
              {selectedApp.campaigns && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-2">案件情報</h4>
                  <p className="font-bold">{selectedApp.campaigns.title}</p>
                  <p className="text-sm text-gray-500">{selectedApp.campaigns.companies?.name || ""}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>報酬: ¥{(selectedApp.campaigns.budget_max || selectedApp.campaigns.budget_min || 0).toLocaleString()}</span>
                    {selectedApp.campaigns.deadline && <span>締切: {new Date(selectedApp.campaigns.deadline).toLocaleDateString("ja-JP")}</span>}
                  </div>
                </div>
              )}
              {selectedApp.motivation && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">応募動機</h4>
                  <p className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic">"{selectedApp.motivation}"</p>
                </div>
              )}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">ステータス変更</h4>
                <div className="flex gap-2 flex-wrap">
                  {APPLICATION_STATUSES.map(s => (
                    <Button key={s.id} size="sm" variant={selectedApp.status === s.id ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedApp.id, s.id)} disabled={updateStatus.isPending}
                      className={selectedApp.status === s.id ? "bg-purple-600" : ""}>
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
