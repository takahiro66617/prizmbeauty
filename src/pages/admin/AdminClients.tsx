import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2, User, Calendar, X, Save, Trash2 } from "lucide-react";
import { useExternalCompanies, useUpdateCompany } from "@/hooks/useExternalCompanies";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { data: companies = [], isLoading, refetch } = useExternalCompanies();
  const { data: campaigns = [] } = useExternalCampaigns();
  const { data: applications = [] } = useExternalApplications();
  const updateCompany = useUpdateCompany();

  const filtered = companies.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.contact_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDetail = (company: any) => {
    setSelectedCompany(company);
    setEditForm({
      name: company.name,
      contact_name: company.contact_name || "",
      contact_email: company.contact_email || "",
      phone: company.phone || "",
      industry: company.industry || "",
      website: company.website || "",
      description: company.description || "",
      status: company.status,
    });
  };

  const handleSave = () => {
    if (!selectedCompany) return;
    updateCompany.mutate({ id: selectedCompany.id, updates: editForm }, {
      onSuccess: () => { toast.success("保存しました"); setSelectedCompany(null); },
      onError: () => toast.error("保存に失敗しました"),
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("この企業を削除しますか？関連する案件・応募も削除される可能性があります。")) return;
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) {
      toast.error("削除に失敗しました（関連データがある場合は先に削除してください）");
    } else {
      toast.success("削除しました");
      refetch();
      setSelectedCompany(null);
    }
  };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-gray-500 mt-1">登録済みの企業一覧です。ステータスの管理・編集を行えます。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="企業名、担当者名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">ステータス: すべて</option>
            <option value="active">契約中</option>
            <option value="pending">承認待ち</option>
            <option value="suspended">停止中</option>
          </select>
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
              ) : filtered.length > 0 ? filtered.map(company => {
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
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => openDetail(company)}>詳細</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(company.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">企業がありません</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>

      {/* Detail/Edit Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedCompany(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">企業詳細・編集</h3>
              <button onClick={() => setSelectedCompany(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">企業名</label>
                  <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">業種</label>
                  <Input value={editForm.industry} onChange={e => setEditForm({ ...editForm, industry: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">担当者名</label>
                  <Input value={editForm.contact_name} onChange={e => setEditForm({ ...editForm, contact_name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                  <Input value={editForm.contact_email} onChange={e => setEditForm({ ...editForm, contact_email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                  <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Webサイト</label>
                  <Input value={editForm.website} onChange={e => setEditForm({ ...editForm, website: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">概要</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                <div className="flex gap-2">
                  {["active", "pending", "suspended"].map(s => (
                    <Button key={s} size="sm" variant={editForm.status === s ? "default" : "outline"}
                      onClick={() => setEditForm({ ...editForm, status: s })}
                      className={editForm.status === s ? "bg-blue-600" : ""}>
                      {s === "active" ? "契約中" : s === "pending" ? "承認待ち" : "停止中"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Company's campaigns */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">この企業の案件</h4>
                {campaigns.filter(c => c.company_id === selectedCompany.id).length > 0 ? (
                  <div className="space-y-2">
                    {campaigns.filter(c => c.company_id === selectedCompany.id).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{c.title}</p>
                          <p className="text-xs text-gray-500">{c.category} | {c.status === "recruiting" ? "募集中" : c.status}</p>
                        </div>
                        <Badge className={c.status === "recruiting" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>{c.status === "recruiting" ? "募集中" : "終了"}</Badge>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">案件なし</p>}
              </div>

              {/* Assigned influencers */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">アサイン済みインフルエンサー</h4>
                {applications.filter(a => a.company_id === selectedCompany.id && a.status === "approved").length > 0 ? (
                  <div className="space-y-2">
                    {applications.filter(a => a.company_id === selectedCompany.id && a.status === "approved").map(a => (
                      <div key={a.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <img src={a.influencer_profiles?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.influencer_profiles?.name || "?")}`} alt="" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-medium text-sm">{a.influencer_profiles?.name || "-"}</p>
                          <p className="text-xs text-gray-500">{a.campaigns?.title || ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">アサイン済みのインフルエンサーなし</p>}
              </div>
            </div>
            <div className="p-6 border-t flex justify-between">
              <Button variant="outline" className="text-red-600 border-red-200" onClick={() => handleDelete(selectedCompany.id)}><Trash2 className="w-4 h-4 mr-2" />削除</Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedCompany(null)}>キャンセル</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={updateCompany.isPending}><Save className="w-4 h-4 mr-2" />保存</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
