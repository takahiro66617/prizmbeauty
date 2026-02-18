import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminInfluencersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [influencers, setInfluencers] = useState<any[]>([]);
  const { toast } = useToast();

  const load = async () => {
    const { data } = await supabase.from("influencer_profiles").select("*").order("created_at", { ascending: false });
    setInfluencers(data || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = influencers.filter(inf => {
    const matchesSearch = !search || inf.name?.includes(search) || inf.username?.includes(search);
    const matchesStatus = statusFilter === "all" || inf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("influencer_profiles").update({ status }).eq("id", id);
    toast({ title: "ステータスを更新しました" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">インフルエンサー管理</h1>
          <p className="text-gray-500 mt-1">登録インフルエンサーの検索・審査を行います。</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="名前・ユーザー名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="all">すべて</option>
            <option value="approved">承認済み</option>
            <option value="pending">審査中</option>
            <option value="suspended">停止中</option>
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">ユーザー</th>
              <th className="px-6 py-4">SNSフォロワー数</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">登録日</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(inf => (
              <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">
                      {inf.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{inf.name}</div>
                      <div className="text-gray-500 text-xs">@{inf.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {inf.instagram_followers > 0 && <span className="text-xs text-pink-600">IG: {inf.instagram_followers?.toLocaleString()}</span>}
                    {inf.tiktok_followers > 0 && <span className="text-xs">TT: {inf.tiktok_followers?.toLocaleString()}</span>}
                    {inf.youtube_followers > 0 && <span className="text-xs text-red-600">YT: {inf.youtube_followers?.toLocaleString()}</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {inf.category && <Badge variant="outline" className="text-[10px]">{inf.category}</Badge>}
                </td>
                <td className="px-6 py-4 text-gray-500">{new Date(inf.created_at).toLocaleDateString("ja-JP")}</td>
                <td className="px-6 py-4">
                  <Badge className={inf.status === "approved" ? "bg-green-100 text-green-700" : inf.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                    {inf.status === "approved" ? "承認済み" : inf.status === "pending" ? "審査中" : "停止中"}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {inf.status === "pending" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => updateStatus(inf.id, "approved")}>承認</Button>}
                    {inf.status === "approved" && <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs" onClick={() => updateStatus(inf.id, "suspended")}>停止</Button>}
                    {inf.status === "suspended" && <Button size="sm" variant="outline" className="text-green-600 border-green-200 text-xs" onClick={() => updateStatus(inf.id, "approved")}>復活</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500">インフルエンサーが登録されていません</div>}
      </div>
    </div>
  );
}
