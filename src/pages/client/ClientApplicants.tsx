import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, X, Search } from "lucide-react";
import { useExternalApplications, useUpdateApplicationStatus } from "@/hooks/useExternalApplications";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { APPLICATION_STATUSES, CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";

export default function ClientApplicants() {
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: applications = [], isLoading } = useExternalApplications({ companyId });
  const { data: campaigns = [] } = useExternalCampaigns(companyId);
  const updateStatus = useUpdateApplicationStatus();
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const filtered = applications.filter(a => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesCampaign = campaignFilter === "all" || a.campaign_id === campaignFilter;
    const matchesCategory = categoryFilter === "all" || a.campaigns?.category === categoryFilter;
    const matchesSearch = !search || (a.influencer_profiles?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesDateFrom = !dateFrom || new Date(a.applied_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(a.applied_at) <= new Date(dateTo + "T23:59:59");
    return matchesStatus && matchesCampaign && matchesCategory && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success(status === "approved" ? "採用しました" : "不採用にしました"),
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  const getStatusBadge = (status: string) => {
    const s = APPLICATION_STATUSES.find(x => x.id === status);
    return <Badge className={s?.color || ""}>{s?.label || status}</Badge>;
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setCampaignFilter("all"); setCategoryFilter("all"); setDateFrom(""); setDateTo(""); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">応募者管理</h1>
        <p className="text-gray-500 mt-1">案件への応募を確認・選考します。</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="IF名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">ステータス: すべて</option>
            {APPLICATION_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">案件: すべて</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">カテゴリ: すべて</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>応募日:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            <span>〜</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">クリア</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const inf = app.influencer_profiles;
            const campaign = app.campaigns;
            return (
              <Card key={app.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <img src={inf?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf?.name || "?")}`} alt="" className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">{inf?.name || "-"}</h3>
                      <span className="text-sm text-gray-500">@{inf?.username || "-"}</span>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">案件: <span className="font-medium">{campaign?.title || "-"}</span></p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <span>応募日: {new Date(app.applied_at).toLocaleDateString("ja-JP")}</span>
                      {inf?.instagram_followers ? <span className="text-pink-600">IG: {inf.instagram_followers.toLocaleString()}</span> : null}
                      {inf?.tiktok_followers ? <span>TT: {inf.tiktok_followers.toLocaleString()}</span> : null}
                      {inf?.youtube_followers ? <span className="text-red-600">YT: {inf.youtube_followers.toLocaleString()}</span> : null}
                    </div>
                    {app.motivation && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg italic">"{app.motivation}"</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {(app.status === "applied" || app.status === "reviewing") && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(app.id, "approved")} disabled={updateStatus.isPending}>
                          <CheckCircle className="w-3 h-3 mr-1" />採用
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleStatusChange(app.id, "rejected")} disabled={updateStatus.isPending}>
                          <XCircle className="w-3 h-3 mr-1" />不採用
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="text-gray-500" onClick={() => setSelectedApp(app)}><Eye className="w-3 h-3 mr-1" />詳細</Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">該当する応募はありません</div>}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">応募者詳細</h3>
              <button onClick={() => setSelectedApp(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedApp.influencer_profiles && (
                <div className="flex items-center gap-4">
                  <img src={selectedApp.influencer_profiles.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApp.influencer_profiles.name)}`} alt="" className="w-16 h-16 rounded-full" />
                  <div>
                    <p className="font-bold text-lg">{selectedApp.influencer_profiles.name}</p>
                    <p className="text-sm text-gray-500">@{selectedApp.influencer_profiles.username}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedApp.influencer_profiles.category || ""}</p>
                  </div>
                </div>
              )}
              {selectedApp.influencer_profiles?.bio && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedApp.influencer_profiles.bio}</p>}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Instagram", val: selectedApp.influencer_profiles?.instagram_followers, color: "bg-pink-50", textColor: "text-pink-600" },
                  { label: "TikTok", val: selectedApp.influencer_profiles?.tiktok_followers, color: "bg-gray-50", textColor: "" },
                  { label: "YouTube", val: selectedApp.influencer_profiles?.youtube_followers, color: "bg-red-50", textColor: "text-red-600" },
                ].map(s => (
                  <div key={s.label} className={`text-center p-3 ${s.color} rounded-lg`}><p className={`text-xs ${s.textColor}`}>{s.label}</p><p className="font-bold">{(s.val || 0).toLocaleString()}</p></div>
                ))}
              </div>
              {selectedApp.motivation && (
                <div><p className="text-sm font-medium text-gray-700 mb-1">応募動機</p><p className="text-sm bg-gray-50 p-3 rounded-lg italic">"{selectedApp.motivation}"</p></div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end"><Button variant="outline" onClick={() => setSelectedApp(null)}>閉じる</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
