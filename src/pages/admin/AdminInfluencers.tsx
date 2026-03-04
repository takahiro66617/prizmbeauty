import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";
import HelpGuideModal from "@/components/admin/HelpGuideModal";
import { useExternalInfluencers, useUpdateInfluencerStatus } from "@/hooks/useExternalInfluencers";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { GENRES, INFLUENCER_STATUSES, APPLICATION_STATUSES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function formatFollowers(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export default function AdminInfluencersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lineFilter, setLineFilter] = useState("all");
  const [followerMin, setFollowerMin] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
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
    navigate(`/admin/influencers/${inf.id}`);
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("このインフルエンサーを却下し退会させますか？")) return;
    const { data, error } = await supabase.functions.invoke("admin-update-influencer", {
      body: { id, updates: { status: "rejected" } },
    });
    if (error || data?.error) { toast.error("処理に失敗しました"); } else { toast.success("却下・退会処理を行いました"); refetch(); }
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
        <HelpGuideModal
          title="インフルエンサー管理の使い方"
          description="登録されたインフルエンサーの審査・プロフィール編集・ステータス管理を行います。"
          sections={[
            { title: "審査プロセス", content: ["新規登録されたIFは「審査中」ステータスで表示", "プロフィール内容を確認し「承認」または「却下」を実行", "承認後、IFは案件への応募が可能になります"] },
            { title: "絞り込み検索", content: ["名前・ユーザー名・ステータス・カテゴリで検索", "LINE連携状況・フォロワー数・登録日でのフィルタリング", "CSV出力機能で一覧データをダウンロード"] },
            { title: "プロフィール編集", content: ["IF名をクリックして詳細を開き編集可能", "SNSアカウント情報・フォロワー数・カテゴリ等を管理", "応募履歴も一緒に確認できます"] },
          ]}
          workflow={[
            "「審査中」のIFを上から順にプロフィールを確認",
            "SNS情報やフォロワー数が適切か判断",
            "問題なければ「承認」、基準に満たなければ「却下」",
            "承認後、IFは案件一覧から応募可能に",
          ]}
        />
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

    </div>
  );
}
