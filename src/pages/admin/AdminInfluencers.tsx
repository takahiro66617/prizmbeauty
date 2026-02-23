import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search, X, Save } from "lucide-react";
import { useExternalInfluencers, useUpdateInfluencerStatus } from "@/hooks/useExternalInfluencers";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { GENRES, INFLUENCER_STATUSES, APPLICATION_STATUSES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminInfluencersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lineFilter, setLineFilter] = useState("all");
  const [followerMin, setFollowerMin] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedInf, setSelectedInf] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const { data: influencers = [], isLoading, refetch } = useExternalInfluencers();
  const { data: applications = [] } = useExternalApplications();
  const updateStatus = useUpdateInfluencerStatus();

  const filtered = influencers.filter(inf => {
    const matchesSearch = !search || inf.name.toLowerCase().includes(search.toLowerCase()) || inf.username.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inf.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || (inf.category || "").includes(categoryFilter);
    const matchesLine = lineFilter === "all" || (lineFilter === "linked" ? !!inf.line_user_id : !inf.line_user_id);
    const totalFollowers = (inf.instagram_followers || 0) + (inf.tiktok_followers || 0) + (inf.youtube_followers || 0) + (inf.twitter_followers || 0);
    const matchesFollower = !followerMin || totalFollowers >= Number(followerMin);
    const matchesDateFrom = !dateFrom || new Date(inf.created_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(inf.created_at) <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesStatus && matchesCategory && matchesLine && matchesFollower && matchesDateFrom && matchesDateTo;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate({ id, status: newStatus }, {
      onSuccess: () => { toast.success("ステータスを更新しました"); refetch(); },
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  const openDetail = (inf: any) => {
    setSelectedInf(inf);
    setEditForm({
      name: inf.name, username: inf.username, bio: inf.bio || "",
      category: inf.category || "",
      selectedGenres: inf.category ? inf.category.split(",").map((g: string) => g.trim()).filter(Boolean) : [],
      instagram_followers: inf.instagram_followers || 0, tiktok_followers: inf.tiktok_followers || 0,
      youtube_followers: inf.youtube_followers || 0, twitter_followers: inf.twitter_followers || 0,
      instagram_url: (inf as any).instagram_url || "",
      tiktok_url: (inf as any).tiktok_url || "",
      youtube_url: (inf as any).youtube_url || "",
      twitter_url: (inf as any).twitter_url || "",
    });
  };

  const toggleGenre = (genre: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genre)
        ? prev.selectedGenres.filter((g: string) => g !== genre)
        : [...prev.selectedGenres, genre],
    }));
  };

  const handleSaveEdit = async () => {
    if (!selectedInf) return;
    const { selectedGenres: genres, ...rest } = editForm;
    const updates = {
      name: rest.name,
      username: rest.username,
      bio: rest.bio,
      category: genres.join(", "),
      instagram_followers: rest.instagram_followers,
      tiktok_followers: rest.tiktok_followers,
      youtube_followers: rest.youtube_followers,
      twitter_followers: rest.twitter_followers,
      instagram_url: rest.instagram_url || null,
      tiktok_url: rest.tiktok_url || null,
      youtube_url: rest.youtube_url || null,
      twitter_url: rest.twitter_url || null,
    };
    const { data, error } = await supabase.functions.invoke("admin-update-influencer", {
      body: { id: selectedInf.id, updates },
    });
    if (error || data?.error) { toast.error("保存に失敗しました"); } else { toast.success("保存しました"); refetch(); setSelectedInf(null); }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("このインフルエンサーを却下し退会させますか？")) return;
    const { data, error } = await supabase.functions.invoke("admin-update-influencer", {
      body: { id, updates: { status: "rejected" } },
    });
    if (error || data?.error) { toast.error("処理に失敗しました"); } else { toast.success("却下・退会処理を行いました"); refetch(); setSelectedInf(null); }
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setCategoryFilter("all"); setLineFilter("all");
    setFollowerMin(""); setDateFrom(""); setDateTo("");
  };

  const infApps = (id: string) => applications.filter(a => a.influencer_id === id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">インフルエンサー管理</h1>
          <p className="text-gray-500 mt-1">登録インフルエンサーの検索・審査・編集を行います。</p>
        </div>
        <Button variant="outline" className="shadow-sm"><Download className="w-4 h-4 mr-2" />CSV出力</Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="名前・ユーザー名で検索..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">ステータス: すべて</option>
              {INFLUENCER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">ジャンル: すべて</option>
              {GENRES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={lineFilter} onChange={e => setLineFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
              <option value="all">LINE: すべて</option>
              <option value="linked">連携済み</option>
              <option value="unlinked">未連携</option>
            </select>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>総フォロワー数:</span>
              <input type="number" value={followerMin} onChange={e => setFollowerMin(e.target.value)} placeholder="最小" className="w-24 px-2 py-1.5 rounded border border-gray-300 text-sm" />
              <span>以上</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>登録日:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
              <span>〜</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">フィルターをクリア</Button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">ユーザー</th>
                <th className="px-6 py-4">LINE</th>
                <th className="px-6 py-4">SNSフォロワー</th>
                <th className="px-6 py-4">ジャンル</th>
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
                const apps = infApps(inf.id);
                const st = INFLUENCER_STATUSES.find(s => s.id === inf.status);
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
                      {inf.line_user_id ? <Badge className="bg-green-100 text-green-700 text-[10px]">連携済</Badge> : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        {inf.instagram_followers ? <span className="text-xs text-pink-600">IG: {inf.instagram_followers.toLocaleString()}</span> : null}
                        {inf.tiktok_followers ? <span className="text-xs">TT: {inf.tiktok_followers.toLocaleString()}</span> : null}
                        {inf.youtube_followers ? <span className="text-xs text-red-600">YT: {inf.youtube_followers.toLocaleString()}</span> : null}
                        {inf.twitter_followers ? <span className="text-xs text-blue-500">X: {inf.twitter_followers.toLocaleString()}</span> : null}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {inf.category ? (
                        <div className="flex flex-wrap gap-1">
                          {inf.category.split(",").map((g: string) => g.trim()).filter(Boolean).map((g: string) => (
                            <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                          ))}
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{apps.length}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(inf.created_at).toLocaleDateString("ja-JP")}</td>
                    <td className="px-6 py-4"><Badge className={st?.color || ""}>{st?.label || inf.status}</Badge></td>
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
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {isLoading ? (
            <div className="px-4 py-12 text-center text-gray-500">読み込み中...</div>
          ) : filtered.length > 0 ? filtered.map(inf => {
            const apps = infApps(inf.id);
            const st = INFLUENCER_STATUSES.find(s => s.id === inf.status);
            return (
              <div key={inf.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={inf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}&background=FFD6E8&color=333`} alt="" className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{inf.name}</div>
                    <div className="text-gray-500 text-xs">@{inf.username}</div>
                  </div>
                  <Badge className={st?.color || ""}>{st?.label || inf.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {inf.category && inf.category.split(",").map((g: string) => g.trim()).filter(Boolean).map((g: string) => (
                    <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => openDetail(inf)}>詳細</Button>
                  {inf.status === "pending" && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7" onClick={() => handleStatusChange(inf.id, "approved")}>承認</Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs h-7" onClick={() => handleReject(inf.id)}>却下</Button>
                    </>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="px-4 py-12 text-center text-gray-500">インフルエンサーがいません</div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 text-center text-gray-500 text-sm">全 {filtered.length} 件</div>
      </div>

      {selectedInf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedInf(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b shrink-0">
              <h3 className="font-bold text-lg">インフルエンサー詳細・編集</h3>
              <button onClick={() => setSelectedInf(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedInf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedInf.name)}`} alt="" className="w-20 h-20 rounded-full" />
                <div>
                  <p className="text-sm text-gray-500">ID: {selectedInf.id.slice(0, 8)}...</p>
                  <p className="text-xs text-gray-400">LINE: {selectedInf.line_user_id || "未連携"}</p>
                  <p className="text-xs text-gray-400">登録日: {new Date(selectedInf.created_at).toLocaleDateString("ja-JP")}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                  <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
                  <Input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} /></div>
              </div>

              {/* Genre chips */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投稿ジャンル <span className="text-xs text-gray-400">(複数選択可)</span></label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => (
                    <button key={genre} type="button" onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        editForm.selectedGenres?.includes(genre)
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white border-gray-200 text-gray-600 hover:border-purple-400"
                      }`}>{genre}</button>
                  ))}
                </div>
              </div>

              <div><label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                <textarea value={editForm.bio} onChange={e => setEditForm({ ...editForm, bio: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[80px]" /></div>

              {/* SNS Followers */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "instagram_followers", label: "Instagram フォロワー" },
                  { key: "tiktok_followers", label: "TikTok フォロワー" },
                  { key: "youtube_followers", label: "YouTube 登録者" },
                  { key: "twitter_followers", label: "X(Twitter) フォロワー" },
                ].map(f => (
                  <div key={f.key}><label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <Input type="number" value={editForm[f.key]} onChange={e => setEditForm({ ...editForm, [f.key]: Number(e.target.value) })} /></div>
                ))}
              </div>

              {/* SNS URLs */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800">SNS URL</h4>
                {[
                  { key: "instagram_url", label: "Instagram URL", placeholder: "https://instagram.com/username" },
                  { key: "tiktok_url", label: "TikTok URL", placeholder: "https://tiktok.com/@username" },
                  { key: "youtube_url", label: "YouTube URL", placeholder: "https://youtube.com/@channel" },
                  { key: "twitter_url", label: "X(Twitter) URL", placeholder: "https://x.com/username" },
                ].map(f => (
                  <div key={f.key}><label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <Input value={editForm[f.key] || ""} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} placeholder={f.placeholder} /></div>
                ))}
              </div>

              {/* Applications */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">受けている案件 ({infApps(selectedInf.id).length}件)</h4>
                <div className="space-y-2">
                  {infApps(selectedInf.id).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{a.campaigns?.title || "-"}</p>
                        <p className="text-xs text-gray-500">{a.campaigns?.companies?.name || ""}</p>
                      </div>
                      <Badge className={a.status === "approved" ? "bg-green-100 text-green-700" : a.status === "applied" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}>
                        {APPLICATION_STATUSES.find(s => s.id === a.status)?.label || a.status}
                      </Badge>
                    </div>
                  ))}
                  {infApps(selectedInf.id).length === 0 && <p className="text-sm text-gray-400">応募なし</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ステータス変更</label>
                <div className="flex gap-2 flex-wrap">
                  {INFLUENCER_STATUSES.map(s => (
                    <Button key={s.id} size="sm" variant={selectedInf.status === s.id ? "default" : "outline"}
                      onClick={() => { if (s.id === "rejected") { handleReject(selectedInf.id); } else { handleStatusChange(selectedInf.id, s.id); } }}
                      className={selectedInf.status === s.id ? "bg-purple-600" : ""}>
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setSelectedInf(null)}>キャンセル</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSaveEdit}><Save className="w-4 h-4 mr-2" />保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
