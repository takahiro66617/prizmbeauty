import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, X, Save, AlertTriangle } from "lucide-react";
import { useExternalCampaigns, useUpdateCampaign, useDeleteCampaign } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { CATEGORIES, PLATFORMS, CAMPAIGN_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

export default function AdminCampaignsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { data: campaigns = [], isLoading } = useExternalCampaigns();
  const { data: applications = [] } = useExternalApplications();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const now = new Date();

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = !search || campaign.title.toLowerCase().includes(search.toLowerCase()) || (campaign.companies?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || campaign.category === categoryFilter;
    const matchesPlatform = platformFilter === "all" || (campaign.platform || "").includes(platformFilter);
    const matchesDeadlineFrom = !deadlineFrom || (campaign.deadline && new Date(campaign.deadline) >= new Date(deadlineFrom));
    const matchesDeadlineTo = !deadlineTo || (campaign.deadline && new Date(campaign.deadline) <= new Date(deadlineTo));
    const matchesBudgetMin = !budgetMin || (campaign.budget_max || 0) >= Number(budgetMin);
    const matchesBudgetMax = !budgetMax || (campaign.budget_min || 0) <= Number(budgetMax);
    return matchesSearch && matchesStatus && matchesCategory && matchesPlatform && matchesDeadlineFrom && matchesDeadlineTo && matchesBudgetMin && matchesBudgetMax;
  });

  const isOverdue = (deadline: string | null) => deadline && new Date(deadline) < now;

  const openDetail = (campaign: any) => {
    setSelectedCampaign(campaign);
    setEditForm({
      title: campaign.title, description: campaign.description || "", category: campaign.category || "",
      budget_min: campaign.budget_min || 0, budget_max: campaign.budget_max || 0,
      deadline: campaign.deadline ? campaign.deadline.split("T")[0] : "",
      payment_date: (campaign as any).payment_date ? (campaign as any).payment_date.split("T")[0] : "",
      requirements: campaign.requirements || "", platform: campaign.platform || "", status: campaign.status,
    });
  };

  const handleSave = () => {
    if (!selectedCampaign) return;
    updateCampaign.mutate({ id: selectedCampaign.id, updates: editForm }, {
      onSuccess: () => { toast.success("保存しました"); setSelectedCampaign(null); },
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("この案件を削除しますか？")) return;
    deleteCampaign.mutate(id, {
      onSuccess: () => { toast.success("削除しました"); setSelectedCampaign(null); },
      onError: () => toast.error("削除に失敗しました"),
    });
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setPlatformFilter("all");
    setDeadlineFrom(""); setDeadlineTo(""); setBudgetMin(""); setBudgetMax("");
  };

  const statusObj = (s: string) => CAMPAIGN_STATUSES.find(x => x.id === s);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">案件管理</h1>
          <p className="text-gray-500 mt-1">全案件を管理・絞り込みできます。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="企業名・案件名で検索..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="all">ステータス: すべて</option>
              {CAMPAIGN_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="all">カテゴリ: すべて</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="all">プラットフォーム: すべて</option>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>締切:</span>
              <input type="date" value={deadlineFrom} onChange={e => setDeadlineFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
              <span>〜</span>
              <input type="date" value={deadlineTo} onChange={e => setDeadlineTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>報酬:</span>
              <input type="number" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="最小" className="w-24 px-2 py-1.5 rounded border border-gray-300 text-sm" />
              <span>〜</span>
              <input type="number" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="最大" className="w-24 px-2 py-1.5 rounded border border-gray-300 text-sm" />
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">フィルターをクリア</Button>
          </div>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">クライアント</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">報酬</th>
              <th className="px-6 py-4">締切</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">応募数</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filteredCampaigns.length > 0 ? filteredCampaigns.map((campaign) => {
              const appCount = applications.filter(a => a.campaign_id === campaign.id).length;
              const overdue = isOverdue(campaign.deadline) && campaign.status === "recruiting";
              return (
                <tr key={campaign.id} className={`hover:bg-gray-50 transition-colors ${overdue ? "bg-red-50" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {campaign.image_url && <img src={campaign.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <span className="font-medium text-gray-900">{campaign.title}</span>
                        {overdue && <div className="flex items-center gap-1 text-xs text-red-600 mt-0.5"><AlertTriangle className="w-3 h-3" />締切超過</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{campaign.companies?.name || "-"}</td>
                  <td className="px-6 py-4"><Badge variant="outline">{campaign.category || "-"}</Badge></td>
                  <td className="px-6 py-4 text-gray-600">¥{(campaign.budget_min || 0).toLocaleString()} - ¥{(campaign.budget_max || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-500">{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString("ja-JP") : "-"}</td>
                  <td className="px-6 py-4"><Badge className={statusObj(campaign.status)?.color || ""}>{statusObj(campaign.status)?.label || campaign.status}</Badge></td>
                  <td className="px-6 py-4 text-gray-600">{appCount}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800" onClick={() => openDetail(campaign)}>編集</Button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">案件がありません</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filteredCampaigns.length} 件</div>
      </div>

      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedCampaign(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">案件編集</h3>
              <button onClick={() => setSelectedCampaign(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                <Input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[100px]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                  <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">未選択</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">プラットフォーム</label>
                  <select value={editForm.platform} onChange={e => setEditForm({ ...editForm, platform: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="">未選択</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬 (最小)</label>
                  <Input type="number" value={editForm.budget_min} onChange={e => setEditForm({ ...editForm, budget_min: Number(e.target.value) })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬 (最大)</label>
                  <Input type="number" value={editForm.budget_max} onChange={e => setEditForm({ ...editForm, budget_max: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">応募締切日</label>
                  <Input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">振込予定日</label>
                  <Input type="date" value={editForm.payment_date} onChange={e => setEditForm({ ...editForm, payment_date: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  {CAMPAIGN_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">応募条件</label>
                <textarea value={editForm.requirements} onChange={e => setEditForm({ ...editForm, requirements: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" /></div>

              <div>
                <h4 className="font-bold text-gray-800 mb-2">この案件への応募 ({applications.filter(a => a.campaign_id === selectedCampaign.id).length}件)</h4>
                <div className="space-y-2">
                  {applications.filter(a => a.campaign_id === selectedCampaign.id).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <img src={a.influencer_profiles?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.influencer_profiles?.name || "?")}`} alt="" className="w-7 h-7 rounded-full" />
                        <span className="text-sm font-medium">{a.influencer_profiles?.name || "-"}</span>
                      </div>
                      <Badge className={a.status === "approved" ? "bg-green-100 text-green-700" : a.status === "applied" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                        {a.status === "applied" ? "新規" : a.status === "approved" ? "採用" : a.status === "rejected" ? "不採用" : a.status}
                      </Badge>
                    </div>
                  ))}
                  {applications.filter(a => a.campaign_id === selectedCampaign.id).length === 0 && <p className="text-sm text-gray-400">応募なし</p>}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-between">
              <Button variant="outline" className="text-red-600 border-red-200" onClick={() => handleDelete(selectedCampaign.id)}>削除</Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedCampaign(null)}>キャンセル</Button>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={updateCampaign.isPending}><Save className="w-4 h-4 mr-2" />保存</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
