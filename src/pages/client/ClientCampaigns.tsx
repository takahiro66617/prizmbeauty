import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ClientCampaigns() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: company } = await supabase.from("companies").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!company) return;
      const { data } = await supabase.from("campaigns").select("*").eq("company_id", company.id).order("created_at", { ascending: false });
      setCampaigns(data || []);
    };
    load();
  }, []);

  const filtered = campaigns.filter(c => statusFilter === "all" || c.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">案件管理</h1><p className="text-gray-500 mt-1">自社の案件一覧を管理します。</p></div>
        <Link to="/client/campaigns/new"><Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新規案件作成</Button></Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">すべて</option>
            <option value="recruiting">募集中</option>
            <option value="in_progress">進行中</option>
            <option value="completed">完了</option>
            <option value="draft">下書き</option>
          </select>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">予算</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">締切</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(campaign => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{campaign.title}</td>
                <td className="px-6 py-4"><Badge variant="outline">{campaign.category || "-"}</Badge></td>
                <td className="px-6 py-4 text-gray-600">{campaign.budget_min && campaign.budget_max ? `¥${campaign.budget_min.toLocaleString()} - ¥${campaign.budget_max.toLocaleString()}` : "-"}</td>
                <td className="px-6 py-4">
                  <Badge className={campaign.status === "recruiting" ? "bg-green-100 text-green-700" : campaign.status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                    {campaign.status === "recruiting" ? "募集中" : campaign.status === "in_progress" ? "進行中" : campaign.status === "completed" ? "完了" : "下書き"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-gray-500">{campaign.deadline ? new Date(campaign.deadline).toLocaleDateString("ja-JP") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>
    </div>
  );
}
