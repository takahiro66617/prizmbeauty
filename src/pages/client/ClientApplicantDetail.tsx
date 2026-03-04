import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Wallet, MessageCircle, Image as ImageIcon } from "lucide-react";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ApplicationProgressTimeline } from "@/components/ApplicationProgressTimeline";

const SNS_COLORS: Record<string, string> = { Instagram: "#E1306C", TikTok: "#010101", YouTube: "#FF0000", X: "#1DA1F2" };

function formatFollowers(n: number) {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export default function ClientApplicantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: applications = [] } = useExternalApplications({ companyId });
  const [bankInfo, setBankInfo] = useState<any>(null);

  const app = applications.find(a => a.id === id);
  const inf = app?.influencer_profiles;
  const camp = app?.campaigns;

  useEffect(() => {
    if (inf?.user_id) {
      supabase.from("bank_accounts").select("*").eq("user_id", inf.user_id).maybeSingle().then(({ data }) => setBankInfo(data));
    }
  }, [inf?.user_id]);

  if (!app) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>応募が見つかりません</p>
        <Button variant="ghost" onClick={() => navigate("/client/applicants")} className="mt-4"><ArrowLeft className="w-4 h-4 mr-2" />一覧に戻る</Button>
      </div>
    );
  }

  const appSt = APPLICATION_STATUSES.find(s => s.id === app.status);

  const snsData = inf ? [
    { name: "Instagram", value: inf.instagram_followers || 0 },
    { name: "TikTok", value: inf.tiktok_followers || 0 },
    { name: "YouTube", value: inf.youtube_followers || 0 },
  ].filter(s => s.value > 0) : [];

  const showBank = ["payment_pending", "post_confirmed", "approved", "in_progress"].includes(app.status);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/client/applicants")} className="text-gray-500">
        <ArrowLeft className="w-4 h-4 mr-1" />一覧に戻る
      </Button>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {inf && <img src={inf.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.name)}`} alt="" className="w-20 h-20 rounded-full shadow-sm shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{inf?.name || "不明"}</h1>
              <span className="text-gray-400">@{inf?.username || "-"}</span>
              <Badge className={appSt?.color || ""}>{appSt?.label || app.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span>案件: {camp?.title || "-"}</span>
              <span>応募日: {new Date(app.applied_at).toLocaleDateString("ja-JP")}</span>
            </div>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 shrink-0" onClick={() => navigate("/client/messages")}>
            <MessageCircle className="w-4 h-4 mr-2" />スレッドへ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Influencer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-800">インフルエンサー情報</h3>
          {inf?.bio && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{inf.bio}</p>}
          {inf?.category && <Badge variant="outline">{inf.category}</Badge>}

          <div className="flex flex-wrap gap-2">
            {inf?.instagram_url && <a href={inf.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs hover:bg-pink-100">📷 Instagram <ExternalLink className="w-3 h-3" /></a>}
            {inf?.tiktok_url && <a href={inf.tiktok_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100">🎵 TikTok <ExternalLink className="w-3 h-3" /></a>}
            {inf?.youtube_url && <a href={inf.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">▶️ YouTube <ExternalLink className="w-3 h-3" /></a>}
            {inf?.twitter_url && <a href={inf.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">𝕏 X <ExternalLink className="w-3 h-3" /></a>}
          </div>

          {snsData.length > 0 && (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={snsData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => formatFollowers(v)} />
                <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatFollowers(v)} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {snsData.map((entry, i) => <Cell key={i} fill={SNS_COLORS[entry.name] || "#6366f1"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Instagram", val: inf?.instagram_followers, bg: "bg-pink-50", color: "text-pink-600" },
              { label: "TikTok", val: inf?.tiktok_followers, bg: "bg-gray-50", color: "" },
              { label: "YouTube", val: inf?.youtube_followers, bg: "bg-red-50", color: "text-red-600" },
            ].map(s => (
              <div key={s.label} className={`text-center p-3 ${s.bg} rounded-lg`}>
                <p className={`text-xs ${s.color}`}>{s.label}</p>
                <p className="font-bold text-sm">{formatFollowers(s.val || 0)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-gray-800">📋 案件詳細</h3>
          {camp && (
            <>
              <div className="flex items-start gap-3">
                {camp.image_url ? <img src={camp.image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" /> : <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><ImageIcon className="w-8 h-8 text-gray-300" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base text-gray-900">{camp.title}</p>
                  {camp.category && <Badge variant="outline" className="text-xs mt-1">{camp.category}</Badge>}
                </div>
              </div>
              {camp.description && <div><p className="text-xs font-medium text-gray-500 mb-1">案件概要</p><p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{camp.description}</p></div>}
              {camp.deliverables && <div><p className="text-xs font-medium text-gray-500 mb-1">📦 納品物</p><p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{camp.deliverables}</p></div>}
              {camp.requirements && <div><p className="text-xs font-medium text-gray-500 mb-1">✅ 条件</p><p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{camp.requirements}</p></div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {camp.platform && <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-gray-500">プラットフォーム</span><p className="font-medium">{camp.platform}</p></div>}
                {camp.deadline && <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-gray-500">締切</span><p className="font-medium">{new Date(camp.deadline).toLocaleDateString("ja-JP")}</p></div>}
                {(camp.budget_min || camp.budget_max) && <div className="bg-gray-50 rounded-lg p-3"><span className="text-xs text-gray-500">報酬</span><p className="font-medium">¥{(camp.budget_min || 0).toLocaleString()} 〜 ¥{(camp.budget_max || 0).toLocaleString()}</p></div>}
              </div>
              <Link to={`/client/campaigns/${camp.id}`}>
                <Button variant="outline" size="sm" className="text-blue-600">案件詳細ページへ →</Button>
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

      {/* Bank Info */}
      {showBank && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Wallet className="w-5 h-5" />振込先情報</h3>
          {bankInfo ? (
            <div className="grid grid-cols-2 gap-3 text-sm bg-blue-50 p-4 rounded-xl">
              <div><span className="text-gray-500">銀行名:</span> <span className="font-medium">{bankInfo.bank_name}</span></div>
              <div><span className="text-gray-500">支店名:</span> <span className="font-medium">{bankInfo.branch_name}</span></div>
              <div><span className="text-gray-500">口座種別:</span> <span className="font-medium">{bankInfo.account_type === "ordinary" ? "普通" : "当座"}</span></div>
              <div><span className="text-gray-500">口座番号:</span> <span className="font-medium">{bankInfo.account_number}</span></div>
              <div className="col-span-2"><span className="text-gray-500">口座名義:</span> <span className="font-medium">{bankInfo.account_holder}</span></div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">振込先情報が未登録です</p>
          )}
        </div>
      )}
    </div>
  );
}
