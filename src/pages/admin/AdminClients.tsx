import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2, User, Calendar } from "lucide-react";
import { useExternalCompanies } from "@/hooks/useExternalCompanies";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const { data: companies = [], isLoading } = useExternalCompanies();
  const { data: campaigns = [] } = useExternalCampaigns();
  const { data: applications = [] } = useExternalApplications();

  const filtered = companies.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.contact_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-gray-500 mt-1">登録済みの企業一覧です。ステータスの管理を行えます。</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />企業登録</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="企業名、担当者名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-3">企業</th>
                <th className="px-6 py-3">担当者</th>
                <th className="px-6 py-3">案件数</th>
                <th className="px-6 py-3">応募数</th>
                <th className="px-6 py-3">登録日</th>
                <th className="px-6 py-3">ステータス</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
              ) : filtered.map(company => {
                const companyCampaigns = campaigns.filter(c => c.company_id === company.id);
                const companyApps = applications.filter(a => a.company_id === company.id);
                return (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Building2 className="w-5 h-5" /></div>
                        <div>
                          <div className="font-bold text-gray-900">{company.name}</div>
                          <div className="text-xs text-gray-500">{company.industry || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{company.contact_name || "-"}</div>
                          <div className="text-xs text-gray-500">{company.contact_email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{companyCampaigns.length}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{companyApps.length}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{new Date(company.created_at).toLocaleDateString("ja-JP")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={company.status === "active" ? "bg-green-50 text-green-700" : company.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}>
                        {company.status === "active" ? "契約中" : company.status === "pending" ? "承認待ち" : "停止中"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">詳細</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
