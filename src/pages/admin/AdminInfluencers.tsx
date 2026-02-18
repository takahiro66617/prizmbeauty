import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search, X, Save } from "lucide-react";
import { useExternalInfluencers, useUpdateInfluencerStatus } from "@/hooks/useExternalInfluencers";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = ["スキンケア", "メイク", "ヘアケア", "ボディケア", "ネイル", "フレグランス", "ダイエット", "ファッション", "ライフスタイル", "ダンス"];

export default function AdminInfluencersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedInf, setSelectedInf] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { data: influencers = [], isLoading, refetch } = useExternalInfluencers();
  const { data: applications = [] } = useExternalApplications();
  const updateStatus = useUpdateInfluencerStatus();

  const filtered = influencers.filter(inf => {
    const matchesSearch = !search || inf.name.toLowerCase().includes(search.toLowerCase()) || inf.username.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inf.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || inf.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus }, {
      onSuccess: () => toast.success("ステータスを更新しました"),
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  const openDetail = (inf: any) => {
    setSelectedInf(inf);
    setEditForm({
      name: inf.name,
      username: inf.username,
      bio: inf.bio || "",
      category: inf.category || "",
      instagram_followers: inf.instagram_followers || 0,
      tiktok_followers: inf.tiktok_followers || 0,
      youtube_followers: inf.youtube_followers || 0,
      twitter_followers: inf.twitter_followers || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedInf) return;
    const { error } = await supabase.from("influencer_profiles").update(editForm).eq("id", selectedInf.id);
    if (error) {
      toast.error("保存に失敗しました");
    } else {
      toast.success("保存しました");
      refetch();
      setSelectedInf(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("このインフルエンサーを却下し退会させますか？この操作は取り消せません。")) return;
    const { error } = await supabase.from("influencer_profiles").update({ status: "rejected" }).eq("id", id);
    if (error) {
      toast.error("処理に失敗しました");
    } else {
      toast.success("却下・退会処理を行いました");
      refetch();
      setSelectedInf(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">インフルエンサー管理</h1>
          <p className="text-gray-500 mt-1">登録インフルエンサーの検索・審査・編集を行います。</p>
        </div>
        <Button variant="outline" className="shadow-sm"><Download className="w-4 h-4 mr-2" />CSV出力</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="名前・ユーザー名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">ステータス: すべて</option>
            <option value="approved">承認済み</option>
            <option value="pending">審査中</option>
            <option value="suspended">停止中</option>
            <option value="active">有効</option>
            <option value="rejected">却下</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">カテゴリ: すべて</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">ユーザー</th>
              <th className="px-6 py-4">LINE連携</th>
              <th className="px-6 py-4">SNSフォロワー数</th>
              <th className="px-6 py-4">カテゴリ</th>
              <th className="px-6 py-4">応募数</th>
              <th className="px-6 py-4">登録日</th>
              <th className="px-6 py-4">ステータス</th>
              <th className="px-6 py-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : filtered.length > 0 ? filtered.map(inf => {
              const apps = applications.filter(a => a.influencer_id === inf.id);
              return (
                <tr key={inf.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={inf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}&background=FFD6E8&color=333`} alt="" className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
                      <div>
                        <div className="font-medium text-gray-900">{inf.name}</div>
                        <div className="text-gray-500 text-xs">@{inf.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {inf.line_user_id ? <Badge className="bg-green-100 text-green-700 text-[10px]">LINE連携済</Badge> : <span className="text-gray-400 text-xs">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {inf.instagram_followers ? <span className="text-xs text-pink-600">IG: {inf.instagram_followers.toLocaleString()}</span> : null}
                      {inf.tiktok_followers ? <span className="text-xs text-black">TT: {inf.tiktok_followers.toLocaleString()}</span> : null}
                      {inf.youtube_followers ? <span className="text-xs text-red-600">YT: {inf.youtube_followers.toLocaleString()}</span> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4">{inf.category ? <Badge variant="outline" className="text-[10px]">{inf.category}</Badge> : "-"}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{apps.length}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(inf.created_at).toLocaleDateString("ja-JP")}</td>
                  <td className="px-6 py-4">
                    <Badge className={inf.status === "approved" ? "bg-green-100 text-green-700" : inf.status === "pending" ? "bg-yellow-100 text-yellow-700" : inf.status === "active" ? "bg-blue-100 text-blue-700" : inf.status === "rejected" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}>
                      {inf.status === "approved" ? "承認済み" : inf.status === "pending" ? "審査中" : inf.status === "active" ? "有効" : inf.status === "suspended" ? "停止中" : inf.status === "rejected" ? "却下" : "未設定"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800" onClick={() => openDetail(inf)}>詳細</Button>
                      {inf.status === "pending" && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7" onClick={() => handleStatusChange(inf.id, "approved")}>承認</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs h-7" onClick={() => handleReject(inf.id)}>却下</Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">インフルエンサーがいません</td></tr>
            )}
          </tbody>
        </table>
        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>

      {/* Detail/Edit Modal */}
      {selectedInf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedInf(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">インフルエンサー詳細・編集</h3>
              <button onClick={() => setSelectedInf(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedInf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedInf.name)}`} alt="" className="w-20 h-20 rounded-full" />
                <div>
                  <p className="text-sm text-gray-500">ID: {selectedInf.id}</p>
                  <p className="text-xs text-gray-400">LINE: {selectedInf.line_user_id || "未連携"}</p>
                  <p className="text-xs text-gray-400">登録日: {new Date(selectedInf.created_at).toLocaleDateString("ja-JP")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                  <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
                  <Input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="">未選択</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <Input type="number" value={editForm.instagram_followers} onChange={e => setEditForm({ ...editForm, instagram_followers: Number(e.target.value) })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                  <Input type="number" value={editForm.tiktok_followers} onChange={e => setEditForm({ ...editForm, tiktok_followers: Number(e.target.value) })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                  <Input type="number" value={editForm.youtube_followers} onChange={e => setEditForm({ ...editForm, youtube_followers: Number(e.target.value) })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Twitter/X</label>
                  <Input type="number" value={editForm.twitter_followers} onChange={e => setEditForm({ ...editForm, twitter_followers: Number(e.target.value) })} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス変更</label>
                <div className="flex gap-2 flex-wrap">
                  {["pending", "approved", "active", "suspended", "rejected"].map(s => (
                    <Button key={s} size="sm" variant={selectedInf.status === s ? "default" : "outline"}
                      onClick={() => { if (s === "rejected") { handleReject(selectedInf.id); } else { handleStatusChange(selectedInf.id, s); } }}
                      className={selectedInf.status === s ? "bg-purple-600" : ""}>
                      {s === "pending" ? "審査中" : s === "approved" ? "承認" : s === "active" ? "有効" : s === "suspended" ? "停止" : "却下・退会"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedInf(null)}>キャンセル</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSaveEdit}><Save className="w-4 h-4 mr-2" />保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
