import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, X, Save } from "lucide-react";
import { useExternalCampaigns, useUpdateCampaign, useDeleteCampaign } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { toast } from "sonner";

export default function AdminCampaignsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { data: campaigns = [], isLoading } = useExternalCampaigns();
  const { data: applications = [] } = useExternalApplications();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = !search || campaign.title.toLowerCase().includes(search.toLowerCase()) || (campaign.companies?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || campaign.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(campaigns.map(c => c.category).filter(Boolean))];

  const openDetail = (campaign: any) => {
    setSelectedCampaign(campaign);
    setEditForm({
      title: campaign.title,
      description: campaign.description || "",
      category: campaign.category || "",
      budget_min: campaign.budget_min || 0,
      budget_max: campaign.budget_max || 0,
      deadline: campaign.deadline ? campaign.deadline.split("T")[0] : "",
      requirements: campaign.requirements || "",
      platform: campaign.platform || "",
      status: campaign.status,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">案件管理</h1>
          <p className="text-gray-500 mt-1">登録されている全案件を管理します。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="企業名・案件名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm">
            <option value="all">ステータス: すべて</option>
            <option value="recruiting">募集中</option>
            <option value="closed">終了</option>
            <option value="completed">完了</option>
            <option value="draft">下書き</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm">
            <option value="all">カテゴリ: すべて</option>
            {categories.map(c => <option key={c} value={c!}>{c}</option>)}
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">クライアント</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">報酬</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">応募数</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => {
                const appCount = applications.filter(a => a.campaign_id === campaign.id).length;
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {campaign.image_url && <img src={campaign.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                        <span className="font-medium text-gray-900">{campaign.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{campaign.companies?.name || "-"}</td>
                    <td className="px-6 py-4"><Badge variant="outline">{campaign.category || "-"}</Badge></td>
                    <td className="px-6 py-4 text-gray-600">¥{(campaign.budget_max || campaign.budget_min || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Badge className={campaign.status === "recruiting" ? "bg-green-100 text-green-700" : campaign.status === "closed" ? "bg-red-100 text-red-700" : campaign.status === "draft" ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}>
                        {campaign.status === "recruiting" ? "募集中" : campaign.status === "closed" ? "終了" : campaign.status === "draft" ? "下書き" : "完了"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{appCount}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800" onClick={() => openDetail(campaign)}>編集</Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">案件がありません</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filteredCampaigns.length} 件</div>
      </div>

      {/* Edit Modal */}
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
                  <Input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">プラットフォーム</label>
                  <Input value={editForm.platform} onChange={e => setEditForm({ ...editForm, platform: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬 (最小)</label>
                  <Input type="number" value={editForm.budget_min} onChange={e => setEditForm({ ...editForm, budget_min: Number(e.target.value) })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">報酬 (最大)</label>
                  <Input type="number" value={editForm.budget_max} onChange={e => setEditForm({ ...editForm, budget_max: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">締切日</label>
                  <Input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option value="draft">下書き</option>
                    <option value="recruiting">募集中</option>
                    <option value="closed">終了</option>
                    <option value="completed">完了</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">応募条件</label>
                <textarea value={editForm.requirements} onChange={e => setEditForm({ ...editForm, requirements: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" /></div>

              {/* Applications for this campaign */}
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
