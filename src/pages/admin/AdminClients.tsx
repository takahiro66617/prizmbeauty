import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setCompanies(data || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = companies.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("companies").update({ status }).eq("id", id);
    toast({ title: "ステータスを更新しました" });
    load();
  };

  return (
    <div className="font-sans space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-gray-500 mt-1">登録済みの企業一覧です。ステータスの管理を行えます。</p>
        </div>
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
                <th className="px-6 py-3">登録日</th>
                <th className="px-6 py-3">ステータス</th>
                <th className="px-6 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(company => (
                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Building2 className="w-5 h-5" /></div>
                      <div>
                        <div className="font-bold text-gray-900">{company.name}</div>
                        <div className="text-xs text-gray-500">{company.contact_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-900">{company.contact_name}</span></div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{new Date(company.created_at).toLocaleDateString("ja-JP")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={company.status === "active" ? "bg-green-50 text-green-700" : company.status === "pending" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}>
                      {company.status === "active" ? "契約中" : company.status === "pending" ? "承認待ち" : "停止中"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {company.status === "pending" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => updateStatus(company.id, "active")}>承認</Button>}
                      {company.status === "active" && <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs" onClick={() => updateStatus(company.id, "suspended")}>停止</Button>}
                      {company.status === "suspended" && <Button size="sm" variant="outline" className="text-green-600 border-green-200 text-xs" onClick={() => updateStatus(company.id, "active")}>復活</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">企業が登録されていません</div>}
        </div>
      </div>
    </div>
  );
}
