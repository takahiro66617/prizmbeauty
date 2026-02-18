import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Search } from "lucide-react";
import { MOCK_INFLUENCERS, getApplicationsForInfluencer } from "@/lib/mockData";

export default function AdminInfluencersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = MOCK_INFLUENCERS.filter(inf => {
    const matchesSearch = !search || inf.name.includes(search) || inf.username.includes(search);
    const matchesStatus = statusFilter === "all" || inf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">インフルエンサー管理</h1>
          <p className="text-gray-500 mt-1">登録インフルエンサーの検索・審査を行います。</p>
        </div>
        <Button variant="outline" className="shadow-sm"><Download className="w-4 h-4 mr-2" />CSV出力</Button>
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
            <option value="reviewing">審査中</option>
            <option value="suspended">停止中</option>
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">ユーザー</th>
              <th className="px-6 py-4">SNSフォロワー数</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">応募数</th>
              <th className="px-6 py-4">登録日</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(inf => {
              const apps = getApplicationsForInfluencer(inf.id);
              return (
                <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={inf.image} alt="" className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                      <div>
                        <div className="font-medium text-gray-900">{inf.name}</div>
                        <div className="text-gray-500 text-xs">@{inf.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {inf.platforms.instagram && <span className="text-xs text-pink-600">IG: {inf.platforms.instagram.toLocaleString()}</span>}
                      {inf.platforms.tiktok && <span className="text-xs text-black">TT: {inf.platforms.tiktok.toLocaleString()}</span>}
                      {inf.platforms.youtube && <span className="text-xs text-red-600">YT: {inf.platforms.youtube.toLocaleString()}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {inf.categories.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{apps.length}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(inf.joinedAt).toLocaleDateString("ja-JP")}</td>
                  <td className="px-6 py-4">
                    <Badge className={inf.status === "approved" ? "bg-green-100 text-green-700" : inf.status === "reviewing" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>
                      {inf.status === "approved" ? "承認済み" : inf.status === "reviewing" ? "審査中" : "停止中"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">詳細</Button>
                      {inf.status === "reviewing" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">承認</Button>}
                      {inf.status === "approved" && <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs">停止</Button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
