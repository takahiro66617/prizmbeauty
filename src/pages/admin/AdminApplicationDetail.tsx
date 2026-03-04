import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useAdminApplications, useAdminUpdateApplicationStatus } from "@/hooks/useAdminData";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ApplicationProgressTimeline } from "@/components/ApplicationProgressTimeline";

const SNS_COLORS: Record<string, string> = { Instagram: "#E1306C", TikTok: "#010101", YouTube: "#FF0000", X: "#1DA1F2" };

function formatFollowers(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: applications = [] } = useAdminApplications();
  const updateStatus = useAdminUpdateApplicationStatus();

  const app = applications.find((a: any) => a.id === id);

  if (!app) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>応募が見つかりません</p>
        <Button variant="ghost" onClick={() => navigate("/admin/applications")} className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />一覧に戻る</Button>
      </div>
    );
  }

  const inf = app.influencer_profiles;
  const camp = app.campaigns;
  const appSt = APPLICATION_STATUSES.find(s => s.id === app.status);

  const snsData = inf ? [
    { name: "Instagram", value: inf.instagram_followers || 0 },
    { name: "TikTok", value: inf.tiktok_followers || 0 },
    { name: "YouTube", value: inf.youtube_followers || 0 },
    { name: "X", value: inf.twitter_followers || 0 },
  ].filter(s => s.value > 0) : [];

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate({ id: app.id, status: newStatus }, {
      onSuccess: () => toast.success("ステータスを更新しました"),
      onError: () => toast.error("更新に失敗しました"),
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/applications")} className="text-gray-500">
          <ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る
        </Button>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {inf && (
            <img src={inf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}`} alt="" className="w-20 h-20 rounded-full shadow-sm shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{inf?.name || "不明"}</h1>
              <span className="text-gray-400">@{inf?.username || "-"}</span>
              <Badge className={appSt?.color || ""}>{appSt?.label || app.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span>案件: {camp?.title || "-"}</span>
              <span>企業: {camp?.companies?.name || "-"}</span>
              <span>応募日: {new Date(app.applied_at).toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Influencer Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-800">インフルエンサー情報</h3>
          {inf?.bio && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{inf.bio}</p>}
          {inf?.category && <Badge variant="outline">{inf.category}</Badge>}
          
          {/* SNS Links */}
          <div className="flex flex-wrap gap-2">
            {inf?.instagram_url && <a href={inf.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs hover:bg-pink-100">📷 Instagram <ExternalLink className="w-3 h-3" /></a>}
            {inf?.tiktok_url && <a href={inf.tiktok_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100">🎵 TikTok <ExternalLink className="w-3 h-3" /></a>}
            {inf?.youtube_url && <a href={inf.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">▶️ YouTube <ExternalLink className="w-3 h-3" /></a>}
            {inf?.twitter_url && <a href={inf.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">𝕏 X <ExternalLink className="w-3 h-3" /></a>}
          </div>

          {/* SNS Chart */}
          {snsData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">フォロワー分布</h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={snsData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatFollowers(v)} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatFollowers(v)} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {snsData.map((entry, i) => <Cell key={i} fill={SNS_COLORS[entry.name] || "#6366f1"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Follower cards */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Instagram", val: inf?.instagram_followers, color: "text-pink-600", bg: "bg-pink-50" },
              { label: "TikTok", val: inf?.tiktok_followers, color: "", bg: "bg-gray-50" },
              { label: "YouTube", val: inf?.youtube_followers, color: "text-red-600", bg: "bg-red-50" },
              { label: "X", val: inf?.twitter_followers, color: "text-blue-500", bg: "bg-blue-50" },
            ].map(s => (
              <div key={s.label} className={`text-center p-3 ${s.bg} rounded-lg`}>
                <p className={`text-xs ${s.color}`}>{s.label}</p>
                <p className="font-bold text-sm">{formatFollowers(s.val || 0)}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Link to={`/admin/influencers/${inf?.id}`}>
              <Button variant="outline" size="sm" className="text-purple-600">IF詳細ページへ →</Button>
            </Link>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-800">📋 案件詳細</h3>
          {camp && (
            <>
              <div className="flex items-start gap-3">
                {camp.image_url ? (
                  <img src={camp.image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><ImageIcon className="w-8 h-8 text-gray-300" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-900">{camp.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{camp.companies?.name || ""}</p>
                  {camp.category && <Badge variant="outline" className="text-xs mt-1">{camp.category}</Badge>}
                </div>
              </div>
              {camp.description && (
                <div><p className="text-xs font-medium text-gray-500 mb-1">案件概要</p><p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{camp.description}</p></div>
              )}
              {camp.deliverables && (
                <div><p className="text-xs font-medium text-gray-500 mb-1">📦 納品物・依頼内容</p><p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{camp.deliverables}</p></div>
              )}
              {camp.requirements && (
                <div><p className="text-xs font-medium text-gray-500 mb-1">✅ 応募条件</p><p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{camp.requirements}</p></div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {camp.platform && <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-gray-500">プラットフォーム</span><p className="font-medium">{camp.platform}</p></div>}
                {camp.deadline && <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-gray-500">締切</span><p className="font-medium">{new Date(camp.deadline).toLocaleDateString("ja-JP")}</p></div>}
                {(camp.budget_min || camp.budget_max) && <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-gray-500">報酬</span><p className="font-medium">¥{(camp.budget_min || 0).toLocaleString()} 〜 ¥{(camp.budget_max || 0).toLocaleString()}</p></div>}
              </div>
              <Link to={`/admin/campaigns/${camp.id}`}>
                <Button variant="outline" size="sm" className="text-purple-600">案件詳細ページへ →</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Motivation */}
      {app.motivation && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3">応募動機</h3>
          <p className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic">"{app.motivation}"</p>
        </div>
      )}

      {/* Status Change */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 mb-4">ステータス変更</h3>
        <div className="flex gap-2 flex-wrap">
          {APPLICATION_STATUSES.map(s => (
            <Button key={s.id} size="sm" variant={app.status === s.id ? "default" : "outline"}
              onClick={() => handleStatusChange(s.id)} disabled={updateStatus.isPending}
              className={app.status === s.id ? "bg-purple-600" : ""}>
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
