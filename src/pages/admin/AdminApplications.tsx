import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminApplications() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, campaigns(title), influencer_profiles(name, username, image_url), companies(name)")
      .order("applied_at", { ascending: false });
    setApplications(data || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = applications.filter(a => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    if (!matchesStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.influencer_profiles?.name?.toLowerCase().includes(q) || a.campaigns?.title?.toLowerCase().includes(q);
  });

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("applications").update({ status }).eq("id", id);
    toast({ title: "ステータスを更新しました" });
    load();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "applied": return <Badge className="bg-blue-100 text-blue-700">新規応募</Badge>;
      case "reviewing": return <Badge className="bg-yellow-100 text-yellow-700">選考中</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-700">採用</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-700">不採用</Badge>;
      case "completed": return <Badge className="bg-gray-100 text-gray-700">完了</Badge>;
      default: return <Badge variant="outline">不明</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">応募管理</h1>
        <p className="text-gray-500 mt-1">全応募の横断一覧です。マッチング状況を確認できます。</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="IF名・案件名で検索..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
          <option value="all">すべて</option>
          <option value="applied">新規応募</option>
          <option value="reviewing">選考中</option>
          <option value="approved">採用</option>
          <option value="rejected">不採用</option>
          <option value="completed">完了</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 font-medium">
            <tr>
              <th className="px-6 py-4">IF名</th>
              <th className="px-6 py-4">案件名</th>
              <th className="px-6 py-4">企業</th>
              <th className="px-6 py-4">応募日</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(app => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">{app.influencer_profiles?.name || "不明"}</span>
                </td>
                <td className="px-6 py-4 text-gray-700">{app.campaigns?.title || "不明"}</td>
                <td className="px-6 py-4 text-gray-600">{app.companies?.name || "不明"}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(app.applied_at).toLocaleDateString("ja-JP")}</td>
                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {(app.status === "applied" || app.status === "reviewing") && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => updateStatus(app.id, "approved")}>採用</Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs" onClick={() => updateStatus(app.id, "rejected")}>不採用</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>
    </div>
  );
}
