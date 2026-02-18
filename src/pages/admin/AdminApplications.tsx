import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useExternalApplications, useUpdateApplicationStatus } from "@/hooks/useExternalApplications";
import { toast } from "sonner";

export default function AdminApplications() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const { data: applications = [], isLoading } = useExternalApplications();
  const updateStatus = useUpdateApplicationStatus();

  const filtered = applications.filter(a => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    if (!matchesStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.influencer_profiles?.name || "").toLowerCase().includes(q) || (a.campaigns?.title || "").toLowerCase().includes(q);
  });

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

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => { toast.success("ステータスを更新しました"); setSelectedApp(null); },
      onError: () => toast.error("更新に失敗しました"),
    });
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
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filtered.length > 0 ? filtered.map(app => (
              <tr key={app.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {app.influencer_profiles && <img src={app.influencer_profiles.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.influencer_profiles.name)}`} alt="" className="w-7 h-7 rounded-full" />}
                    <span className="font-medium text-gray-900">{app.influencer_profiles?.name || "-"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{app.campaigns?.title || "-"}</td>
                <td className="px-6 py-4 text-gray-600">{app.campaigns?.companies?.name || "-"}</td>
                <td className="px-6 py-4 text-gray-500">{new Date(app.applied_at).toLocaleDateString("ja-JP")}</td>
                <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800" onClick={() => setSelectedApp(app)}>詳細</Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">応募がありません</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">応募詳細</h3>
              <button onClick={() => setSelectedApp(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Influencer Info */}
              {selectedApp.influencer_profiles && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-3">インフルエンサー情報</h4>
                  <div className="flex items-center gap-4">
                    <img src={selectedApp.influencer_profiles.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApp.influencer_profiles.name)}`} alt="" className="w-16 h-16 rounded-full" />
                    <div>
                      <p className="font-bold text-gray-900">{selectedApp.influencer_profiles.name}</p>
                      <p className="text-sm text-gray-500">@{selectedApp.influencer_profiles.username}</p>
                      <p className="text-xs text-gray-500 mt-1">{selectedApp.influencer_profiles.category || "未設定"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-xs text-pink-600">Instagram</p>
                      <p className="font-bold">{(selectedApp.influencer_profiles.instagram_followers || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-xs">TikTok</p>
                      <p className="font-bold">{(selectedApp.influencer_profiles.tiktok_followers || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded-lg">
                      <p className="text-xs text-red-600">YouTube</p>
                      <p className="font-bold">{(selectedApp.influencer_profiles.youtube_followers || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedApp.influencer_profiles.bio && <p className="text-sm text-gray-600 mt-3">{selectedApp.influencer_profiles.bio}</p>}
                </div>
              )}
              {/* Campaign Info */}
              {selectedApp.campaigns && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold text-gray-800 mb-2">案件情報</h4>
                  <p className="font-bold">{selectedApp.campaigns.title}</p>
                  <p className="text-sm text-gray-500">{selectedApp.campaigns.companies?.name || ""}</p>
                  <p className="text-sm text-gray-600 mt-1">報酬: ¥{(selectedApp.campaigns.budget_max || selectedApp.campaigns.budget_min || 0).toLocaleString()}</p>
                </div>
              )}
              {selectedApp.motivation && (
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">応募動機</h4>
                  <p className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic">"{selectedApp.motivation}"</p>
                </div>
              )}
              {/* Status Change */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3">ステータス変更</h4>
                <div className="flex gap-2 flex-wrap">
                  {["applied", "reviewing", "approved", "rejected", "completed"].map(s => (
                    <Button key={s} size="sm" variant={selectedApp.status === s ? "default" : "outline"}
                      onClick={() => handleStatusChange(selectedApp.id, s)}
                      disabled={updateStatus.isPending}
                      className={selectedApp.status === s ? "bg-purple-600" : ""}>
                      {s === "applied" ? "新規応募" : s === "reviewing" ? "選考中" : s === "approved" ? "採用" : s === "rejected" ? "不採用" : "完了"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
