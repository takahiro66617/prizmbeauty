import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { CATEGORIES, PLATFORMS, CAMPAIGN_STATUSES } from "@/lib/constants";

export default function ClientCampaigns() {
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: campaigns = [], isLoading } = useExternalCampaigns(companyId);
  const { data: applications = [] } = useExternalApplications({ companyId });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");

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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
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
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>
    </div>
  );
}
