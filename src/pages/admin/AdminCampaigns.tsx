import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertTriangle, Image as ImageIcon } from "lucide-react";
import HelpGuideModal from "@/components/admin/HelpGuideModal";
import { useAdminCampaigns, useAdminUpdateCampaign, useAdminApplications } from "@/hooks/useAdminData";
import { CATEGORIES, PLATFORMS, CAMPAIGN_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

export default function AdminCampaignsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const { data: campaigns = [], isLoading } = useAdminCampaigns();
  const { data: applications = [] } = useAdminApplications();
  const updateCampaign = useAdminUpdateCampaign();

  const now = new Date();

  const filteredCampaigns = campaigns.filter((campaign: any) => {
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
  const statusObj = (s: string) => CAMPAIGN_STATUSES.find(x => x.id === s);

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setPlatformFilter("all");
    setDeadlineFrom(""); setDeadlineTo(""); setBudgetMin(""); setBudgetMax("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">案件管理</h1>
          <p className="text-gray-500 mt-1">全案件を管理・絞り込みできます。</p>
        </div>
        <HelpGuideModal
          title="案件管理の使い方"
          description="企業が作成した案件を一覧で確認し、承認・却下・編集を行えます。"
          sections={[
            { title: "承認フロー", content: ["企業が作成した案件は「承認待ち」で登録されます", "内容を確認し「承認」→承認済みに変更", "承認済みの案件のみインフルエンサーに公開されます"] },
            { title: "絞り込み検索", content: ["企業名・案件名・ステータス・カテゴリ・プラットフォームで絞り込み", "締切日・報酬額での範囲指定も可能"] },
          ]}
          workflow={["「承認待ち」の案件を確認し、内容をチェック", "問題なければ「承認」、修正が必要なら「却下」", "行をクリックで詳細・編集ページへ移動"]}
        />
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
            ) : filteredCampaigns.length > 0 ? filteredCampaigns.map((campaign: any) => {
              const appCount = applications.filter((a: any) => a.campaign_id === campaign.id).length;
              const overdue = isOverdue(campaign.deadline) && campaign.status === "recruiting";
              return (
                <tr key={campaign.id} className={`hover:bg-gray-50 transition-colors cursor-pointer ${overdue ? "bg-red-50" : ""}`}
                  onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {campaign.image_url ? (
                        <img src={campaign.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0"><ImageIcon className="w-4 h-4 text-gray-400" /></div>
                      )}
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
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {campaign.status === "pending_approval" && (
                        <>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 hover:bg-green-50"
                            onClick={() => { updateCampaign.mutate({ id: campaign.id, updates: { status: "recruiting" } }, { onSuccess: () => toast.success("承認して公開しました"), onError: () => toast.error("失敗しました") }); }}>
                            承認
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            onClick={() => { updateCampaign.mutate({ id: campaign.id, updates: { status: "rejected" } }, { onSuccess: () => toast.success("却下しました"), onError: () => toast.error("失敗しました") }); }}>
                            却下
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800" onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}>詳細</Button>
                    </div>
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
    </div>
  );
}
