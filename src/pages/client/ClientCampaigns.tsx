import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { getCampaignsForCompany, getApplicationsForCampaign } from "@/lib/mockData";

export default function ClientCampaigns() {
  const companyId = sessionStorage.getItem("client_company_id") || "c1";
  const campaigns = getCampaignsForCompany(companyId);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = campaigns.filter(c => statusFilter === "all" || c.status === statusFilter);

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
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">すべて</option>
            <option value="recruiting">募集中</option>
            <option value="closed">終了</option>
            <option value="finished">完了</option>
          </select>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">報酬</th>
              <th className="px-6 py-4">応募状況</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">締切</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(campaign => {
              const apps = getApplicationsForCampaign(campaign.id);
              return (
                <tr key={campaign.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{campaign.title}</td>
                  <td className="px-6 py-4"><Badge variant="outline">{campaign.category}</Badge></td>
                  <td className="px-6 py-4 text-gray-600">¥{campaign.reward.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">{apps.length} / {campaign.maxApplicants}</td>
                  <td className="px-6 py-4">
                    <Badge className={campaign.status === "recruiting" ? "bg-green-100 text-green-700" : campaign.status === "closed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}>
                      {campaign.status === "recruiting" ? "募集中" : campaign.status === "closed" ? "終了" : "完了"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{campaign.deadline}</td>
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
