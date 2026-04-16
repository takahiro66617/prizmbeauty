import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, ExternalLink, Instagram, Youtube, Send, MessageCircle } from "lucide-react";
import { useExternalInfluencers, useUpdateInfluencerStatus } from "@/hooks/useExternalInfluencers";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { GENRES, INFLUENCER_STATUSES, APPLICATION_STATUSES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SNS_COLORS = { instagram: "#E1306C", tiktok: "#010101", youtube: "#FF0000", twitter: "#1DA1F2" };

function formatFollowers(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export default function AdminInfluencerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: influencers = [], refetch } = useExternalInfluencers();
  const { data: applications = [] } = useExternalApplications();
  const inf = influencers.find(i => i.id === id);

  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [lineMessage, setLineMessage] = useState("");
  const [sendingLine, setSendingLine] = useState(false);

  const handleSendLine = async () => {
    if (!inf?.line_user_id || !lineMessage.trim()) return;
    setSendingLine(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-line-message", {
        body: {
          line_user_id: inf.line_user_id,
          message: lineMessage.trim(),
          influencer_id: inf.id,
          message_type: "manual",
          sent_by: "admin",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("LINEメッセージを送信しました");
      setLineMessage("");
    } catch (e: any) {
      toast.error(`送信失敗: ${e.message || "エラーが発生しました"}`);
    }
    setSendingLine(false);
  };

  // Initialize edit form when inf loads
  if (inf && !editForm) {
    setEditForm({
      name: inf.name, username: inf.username, bio: inf.bio || "",
      selectedGenres: inf.category ? inf.category.split(",").map((g: string) => g.trim()).filter(Boolean) : [],
      pendingStatus: inf.status,
      instagram_followers: inf.instagram_followers || 0, tiktok_followers: inf.tiktok_followers || 0,
      youtube_followers: inf.youtube_followers || 0, twitter_followers: inf.twitter_followers || 0,
      instagram_url: (inf as any).instagram_url || "",
      tiktok_url: (inf as any).tiktok_url || "",
      youtube_url: (inf as any).youtube_url || "",
      twitter_url: (inf as any).twitter_url || "",
    });
  }

  const infApps = useMemo(() => applications.filter(a => a.influencer_id === id), [applications, id]);

  // Chart data
  const snsData = useMemo(() => {
    if (!inf) return [];
    return [
      { name: "Instagram", value: inf.instagram_followers || 0, color: SNS_COLORS.instagram },
      { name: "TikTok", value: inf.tiktok_followers || 0, color: SNS_COLORS.tiktok },
      { name: "YouTube", value: inf.youtube_followers || 0, color: SNS_COLORS.youtube },
      { name: "X", value: inf.twitter_followers || 0, color: SNS_COLORS.twitter },
    ].filter(d => d.value > 0);
  }, [inf]);

  const appStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    infApps.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => {
      const s = APPLICATION_STATUSES.find(x => x.id === status);
      return { name: s?.label || status, value: count };
    });
  }, [infApps]);

  const totalFollowers = (inf?.instagram_followers || 0) + (inf?.tiktok_followers || 0) + (inf?.youtube_followers || 0) + (inf?.twitter_followers || 0);

  const toggleGenre = (genre: string) => {
    if (!editForm) return;
    setEditForm((prev: any) => ({
      ...prev,
      selectedGenres: prev.selectedGenres.includes(genre)
        ? prev.selectedGenres.filter((g: string) => g !== genre)
        : [...prev.selectedGenres, genre],
    }));
  };

  const handleSave = async () => {
    if (!inf || !editForm) return;
    setSaving(true);
    try {
      const { selectedGenres: genres, pendingStatus, ...rest } = editForm;
      if (pendingStatus && pendingStatus !== inf.status) {
        if (pendingStatus === "rejected" && !window.confirm("このインフルエンサーを却下しますか？")) { setSaving(false); return; }
        const { error } = await supabase.functions.invoke("admin-update-influencer", {
          body: { id: inf.id, updates: { status: pendingStatus } },
        });
        if (error) throw error;
      }
      const updates = {
        name: rest.name, username: rest.username, bio: rest.bio,
        category: genres.join(", "),
        instagram_followers: rest.instagram_followers, tiktok_followers: rest.tiktok_followers,
        youtube_followers: rest.youtube_followers, twitter_followers: rest.twitter_followers,
        instagram_url: rest.instagram_url || null, tiktok_url: rest.tiktok_url || null,
        youtube_url: rest.youtube_url || null, twitter_url: rest.twitter_url || null,
      };
      const { error } = await supabase.functions.invoke("admin-update-influencer", {
        body: { id: inf.id, updates },
      });
      if (error) throw error;
      toast.success("保存しました");
      refetch();
    } catch {
      toast.error("保存に失敗しました");
    }
    setSaving(false);
  };

  if (!inf) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>インフルエンサーが見つかりません</p>
        <Button variant="ghost" onClick={() => navigate("/admin/influencers")} className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />一覧に戻る</Button>
      </div>
    );
  }

  if (!editForm) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  const st = INFLUENCER_STATUSES.find(s => s.id === inf.status);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/influencers")} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る
        </Button>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img src={inf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}&size=120&background=FFD6E8&color=333`}
            alt="" className="w-24 h-24 rounded-2xl object-cover shadow-sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{inf.name}</h1>
              <Badge className={st?.color || ""}>{st?.label || inf.status}</Badge>
              {inf.line_user_id && <Badge className="bg-green-100 text-green-700">LINE連携済</Badge>}
            </div>
            <p className="text-gray-500 mt-1">@{inf.username}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span>ID: {inf.id.slice(0, 8)}...</span>
              <span>登録日: {new Date(inf.created_at).toLocaleDateString("ja-JP")}</span>
            </div>
            {inf.bio && <p className="text-sm text-gray-600 mt-3 line-clamp-3">{inf.bio}</p>}
            {/* Genre badges */}
            {inf.category && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {inf.category.split(",").map((g: string) => g.trim()).filter(Boolean).map((g: string) => (
                  <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />{saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-xs text-gray-400 mb-1">総フォロワー</p>
          <p className="text-2xl font-bold text-gray-900">{formatFollowers(totalFollowers)}</p>
        </div>
        {[
          { label: "Instagram", value: inf.instagram_followers || 0, color: "text-pink-600", url: (inf as any).instagram_url },
          { label: "TikTok", value: inf.tiktok_followers || 0, color: "text-gray-900", url: (inf as any).tiktok_url },
          { label: "YouTube", value: inf.youtube_followers || 0, color: "text-red-600", url: (inf as any).youtube_url },
          { label: "X", value: inf.twitter_followers || 0, color: "text-blue-500", url: (inf as any).twitter_url },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{formatFollowers(s.value)}</p>
            {s.url && (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center justify-center gap-0.5 mt-1">
                <ExternalLink className="w-3 h-3" />プロフィール
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SNS Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">SNSフォロワー構成</h3>
          {snsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={snsData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {snsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(val: number) => formatFollowers(val)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-gray-400">SNSフォロワーデータなし</p>
          )}
        </div>

        {/* Application Status Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">応募ステータス分布 ({infApps.length}件)</h3>
          {appStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appStatusData} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-gray-400">応募データなし</p>
          )}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">応募中の案件 ({infApps.length}件)</h3>
        {infApps.length > 0 ? (
          <div className="space-y-3">
            {infApps.map(a => {
              const appSt = APPLICATION_STATUSES.find(s => s.id === a.status);
              return (
                <div key={a.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {a.campaigns?.image_url ? (
                      <img src={a.campaigns.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 text-xs text-gray-400">📋</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{a.campaigns?.title || "不明な案件"}</p>
                      <p className="text-xs text-gray-500">{a.campaigns?.companies?.name || ""} · {new Date(a.applied_at).toLocaleDateString("ja-JP")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {a.campaigns?.budget_max && (
                      <span className="text-sm text-gray-500">¥{(a.campaigns.budget_max || 0).toLocaleString()}</span>
                    )}
                    <Badge className={appSt?.color || ""}>{appSt?.label || a.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">応募なし</p>
        )}
      </div>

      {/* Edit Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">プロフィール編集</h3>
        <div className="space-y-5">
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
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3">SNS フォロワー数</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: "instagram_followers", label: "Instagram", color: "border-pink-200 focus-within:border-pink-400" },
                { key: "tiktok_followers", label: "TikTok", color: "border-gray-300 focus-within:border-gray-500" },
                { key: "youtube_followers", label: "YouTube", color: "border-red-200 focus-within:border-red-400" },
                { key: "twitter_followers", label: "X(Twitter)", color: "border-blue-200 focus-within:border-blue-400" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <Input type="number" value={editForm[f.key]} onChange={e => setEditForm({ ...editForm, [f.key]: Number(e.target.value) })} className={f.color} />
                </div>
              ))}
            </div>
          </div>

          {/* SNS URLs */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-3">SNS URL</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/username" },
                { key: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@username" },
                { key: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@channel" },
                { key: "twitter_url", label: "X(Twitter)", placeholder: "https://x.com/username" },
              ].map(f => (
                <div key={f.key}><label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <Input value={editForm[f.key] || ""} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} placeholder={f.placeholder} /></div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス変更</label>
            <div className="flex gap-2 flex-wrap">
              {INFLUENCER_STATUSES.map(s => (
                <Button key={s.id} size="sm" variant={editForm.pendingStatus === s.id ? "default" : "outline"}
                  onClick={() => setEditForm({ ...editForm, pendingStatus: s.id })}
                  className={editForm.pendingStatus === s.id ? "bg-purple-600" : ""}>
                  {s.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">※ 「保存」ボタンを押すと反映されます</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => navigate("/admin/influencers")}>キャンセル</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />{saving ? "保存中..." : "保存"}
            </Button>
          </div>

          {/* LINE Message Section */}
          {inf.line_user_id && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200 mt-4">
              <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                LINEメッセージ送信
              </h4>
              <p className="text-xs text-gray-500 mb-3">このインフルエンサーにLINEで直接メッセージを送信します。</p>
              <Textarea
                value={lineMessage}
                onChange={e => setLineMessage(e.target.value)}
                placeholder="メッセージを入力..."
                rows={3}
                className="mb-2 bg-white"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSendLine}
                  disabled={sendingLine || !lineMessage.trim()}
                >
                  <Send className="w-4 h-4 mr-1" />
                  {sendingLine ? "送信中..." : "LINE送信"}
                </Button>
              </div>
            </div>
          )}
          {!inf.line_user_id && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-4">
              <p className="text-sm text-gray-400 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                LINE未連携のためメッセージ送信はできません
              </p>
            </div>
          )}

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mt-4">
            <h4 className="font-bold text-gray-800 mb-2">📩 お問い合わせ先</h4>
            <p className="text-sm text-gray-700">メール 24時間受付（返信: 2〜3営業日）</p>
            <a href="mailto:media@pr-izm.com" className="text-sm text-blue-600 hover:underline font-medium">media@pr-izm.com</a>
          </div>
        </div>
      </div>
    </div>
  );
}
