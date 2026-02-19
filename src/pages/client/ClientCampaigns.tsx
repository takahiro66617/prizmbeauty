import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { useExternalCampaigns, useUpdateCampaign, useDeleteCampaign, ExternalCampaign } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { CATEGORIES, PLATFORMS, CAMPAIGN_STATUSES } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

function EditCampaignDialog({ campaign, open, onOpenChange }: { campaign: ExternalCampaign | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const updateCampaign = useUpdateCampaign();
  const [form, setForm] = useState({
    title: "", description: "", category: "スキンケア", budgetMin: "", budgetMax: "",
    maxApplicants: "", deadline: "", paymentDate: "", requirements: "", platforms: [] as string[],
    deliverables: "", status: "recruiting",
  });

  useEffect(() => {
    if (campaign) {
      setForm({
        title: campaign.title || "",
        description: campaign.description || "",
        category: campaign.category || "スキンケア",
        budgetMin: String(campaign.budget_min || ""),
        budgetMax: String(campaign.budget_max || ""),
        maxApplicants: String((campaign as any).max_applicants || ""),
        deadline: campaign.deadline ? campaign.deadline.slice(0, 10) : "",
        paymentDate: (campaign as any).payment_date ? (campaign as any).payment_date.slice(0, 10) : "",
        requirements: campaign.requirements || "",
        platforms: campaign.platform ? campaign.platform.split(",").filter(Boolean) : [],
        deliverables: (campaign as any).deliverables || "",
        status: campaign.status || "recruiting",
      });
    }
  }, [campaign]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;
    updateCampaign.mutate({
      id: campaign.id,
      updates: {
        title: form.title,
        description: form.description,
        category: form.category,
        budget_min: Number(form.budgetMin) || 0,
        budget_max: Number(form.budgetMax) || 0,
        deadline: form.deadline || null,
        requirements: form.requirements,
        platform: form.platforms.join(","),
        status: form.status,
      } as any,
    }, {
      onSuccess: () => { toast.success("案件を更新しました"); onOpenChange(false); },
      onError: () => toast.error("案件の更新に失敗しました"),
    });
  };

  const togglePlatform = (p: string) => {
    setForm(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>案件を編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案件タイトル</label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案件説明</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CAMPAIGN_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">報酬額（最小・円）</label>
              <Input type="number" value={form.budgetMin} onChange={e => setForm({ ...form, budgetMin: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">報酬額（最大・円）</label>
              <Input type="number" value={form.budgetMax} onChange={e => setForm({ ...form, budgetMax: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">応募締切</label>
              <Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">振込予定日</label>
              <Input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">プラットフォーム</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button key={p} type="button" onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.platforms.includes(p) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">応募条件</label>
            <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">成果物</label>
            <textarea value={form.deliverables} onChange={e => setForm({ ...form, deliverables: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px]" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={updateCampaign.isPending}>
              {updateCampaign.isPending ? "更新中..." : "更新する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientCampaigns() {
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: campaigns = [], isLoading } = useExternalCampaigns(companyId);
  const deleteCampaign = useDeleteCampaign();
  const { data: applications = [] } = useExternalApplications({ companyId });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [editCampaign, setEditCampaign] = useState<ExternalCampaign | null>(null);

  const now = new Date();

  const filtered = campaigns.filter(c => {
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchesDeadlineFrom = !deadlineFrom || (c.deadline && new Date(c.deadline) >= new Date(deadlineFrom));
    const matchesDeadlineTo = !deadlineTo || (c.deadline && new Date(c.deadline) <= new Date(deadlineTo));
    return matchesStatus && matchesCategory && matchesSearch && matchesDeadlineFrom && matchesDeadlineTo;
  });

  const isOverdue = (d: string | null, status: string) => d && new Date(d) < now && status === "recruiting";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">案件管理</h1>
          <p className="text-gray-500 mt-1">自社の案件一覧を管理します。</p>
        </div>
        <Link to="/client/campaigns/new">
          <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新規案件作成</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="案件名で検索..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="all">ステータス: すべて</option>
              {CAMPAIGN_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
              <option value="all">カテゴリ: すべて</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>締切:</span>
              <input type="date" value={deadlineFrom} onChange={e => setDeadlineFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
              <span>〜</span>
              <input type="date" value={deadlineTo} onChange={e => setDeadlineTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            </div>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">報酬</th>
              <th className="px-6 py-4">応募数</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">締切</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filtered.map(campaign => {
              const appCount = applications.filter(a => a.campaign_id === campaign.id).length;
              const overdue = isOverdue(campaign.deadline, campaign.status);
              const st = CAMPAIGN_STATUSES.find(s => s.id === campaign.status);
              return (
                <tr key={campaign.id} className={`hover:bg-gray-50 ${overdue ? "bg-red-50" : ""}`}>
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-medium text-gray-900">{campaign.title}</span>
                      {overdue && <div className="flex items-center gap-1 text-xs text-red-600 mt-0.5"><AlertTriangle className="w-3 h-3" />締切超過</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4"><Badge variant="outline">{campaign.category || "-"}</Badge></td>
                  <td className="px-6 py-4 text-gray-600">¥{(campaign.budget_min || 0).toLocaleString()} - ¥{(campaign.budget_max || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{appCount}</td>
                  <td className="px-6 py-4"><Badge className={st?.color || ""}>{st?.label || campaign.status}</Badge></td>
                  <td className="px-6 py-4 text-gray-500">{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString("ja-JP") : "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditCampaign(campaign)}>
                          <Pencil className="w-4 h-4 mr-1" />編集
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (window.confirm(`「${campaign.title}」を削除しますか？この操作は取り消せません。`)) {
                              deleteCampaign.mutate(campaign.id, {
                                onSuccess: () => toast.success("案件を削除しました"),
                                onError: () => toast.error("削除に失敗しました"),
                              });
                            }
                          }}
                          disabled={deleteCampaign.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />削除
                        </Button>
                      </div>
                    </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>

      <EditCampaignDialog campaign={editCampaign} open={!!editCampaign} onOpenChange={v => { if (!v) setEditCampaign(null); }} />
    </div>
  );
}
