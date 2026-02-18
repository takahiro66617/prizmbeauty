import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";

export default function AdminCampaignsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: campaigns = [], isLoading } = useExternalCampaigns();
  const { data: applications = [] } = useExternalApplications();

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      !search ||
      campaign.title.toLowerCase().includes(search.toLowerCase()) ||
      (campaign.companies?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">案件管理</h1>
          <p className="text-gray-500 mt-1">登録されている全案件を管理します。</p>
        </div>
        <Button className="shadow-lg bg-pink-500 hover:bg-pink-600">
          <Plus className="w-4 h-4 mr-2" /> 新規案件登録
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="企業名・案件名で検索..."
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="all">ステータス: すべて</option>
            <option value="recruiting">募集中</option>
            <option value="closed">終了</option>
            <option value="finished">完了</option>
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">クライアント</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">応募数</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => {
                const appCount = applications.filter(a => a.campaign_id === campaign.id).length;
                return (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{campaign.title}</td>
                    <td className="px-6 py-4 text-gray-600">{campaign.companies?.name || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${campaign.status === "recruiting" ? "bg-green-100 text-green-700" : campaign.status === "closed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                        {campaign.status === "recruiting" ? "募集中" : campaign.status === "closed" ? "終了" : "完了"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{appCount}</td>
                    <td className="px-6 py-4">
                      <Link to={`/campaigns/${campaign.id}`}>
                        <button className="text-purple-600 hover:text-purple-800 font-medium">編集</button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">案件がありません</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filteredCampaigns.length} 件</div>
      </div>
    </div>
  );
}
