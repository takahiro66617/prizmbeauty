import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, X, Search, MessageCircle, Send, Wallet, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useQueryClient } from "@tanstack/react-query";
import { APPLICATION_STATUSES, CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ThreadConversation from "@/components/ThreadConversation";

const STATUS_FLOW: Record<string, string> = {
  approved: "in_progress",
  in_progress: "post_submitted",
  post_submitted: "post_confirmed",
  revision_requested: "post_submitted",
  post_confirmed: "payment_pending",
  payment_pending: "completed",
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  approved: "案件開始",
  in_progress: "投稿報告を確認",
  post_submitted: "投稿を承認",
  post_confirmed: "振込処理へ",
  payment_pending: "振込完了",
};

export default function ClientApplicants() {
  const companyId = sessionStorage.getItem("client_company_id") || "";
  const { data: applications = [], isLoading } = useExternalApplications({ companyId });
  const { data: campaigns = [] } = useExternalCampaigns(companyId);
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [threadAppId, setThreadAppId] = useState<string | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const companyUserId = sessionStorage.getItem("client_user_id") || "";

  const filtered = applications.filter(a => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesCampaign = campaignFilter === "all" || a.campaign_id === campaignFilter;
    const matchesCategory = categoryFilter === "all" || a.campaigns?.category === categoryFilter;
    const matchesSearch = !search || (a.influencer_profiles?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesDateFrom = !dateFrom || new Date(a.applied_at) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(a.applied_at) <= new Date(dateTo + "T23:59:59");
    return matchesStatus && matchesCampaign && matchesCategory && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Group applications by campaign
  const groupedByCampaign = useMemo(() => {
    const groups: Record<string, { campaign: any; applications: any[] }> = {};
    for (const app of filtered) {
      const cid = app.campaign_id;
      if (!groups[cid]) {
        groups[cid] = {
          campaign: app.campaigns || { id: cid, title: "不明な案件" },
          applications: [],
        };
      }
      groups[cid].applications.push(app);
    }
    return Object.values(groups);
  }, [filtered]);

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(campaignId)) next.delete(campaignId);
      else next.add(campaignId);
      return next;
    });
  };

  const invokeStatusUpdate = async (app: any, newStatus: string, message?: string, notification?: { title: string; message: string; type?: string; link?: string }) => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-status-notification", {
        body: {
          applicationId: app.id,
          newStatus,
          message: message || null,
          notificationTitle: notification?.title || null,
          notificationMessage: notification?.message || null,
          notificationType: notification?.type || "info",
          notificationLink: notification?.link || "/mypage/applications",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["ext-applications"] });
      return data;
    } finally {
      setIsUpdating(false);
    }
  };

  const buildApprovalMessage = (app: any) => {
    const c = app.campaigns;
    const title = c?.title || "案件";
    const lines = [`🎉 おめでとうございます！「${title}」に採用されました。\n`];
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push(`📋 案件名: ${title}`);
    if (c?.description) lines.push(`\n📝 案件概要:\n${c.description}`);
    if (c?.deliverables) lines.push(`\n📦 納品物・依頼内容:\n${c.deliverables}`);
    if (c?.requirements) lines.push(`\n✅ 応募条件・注意事項:\n${c.requirements}`);
    if (c?.platform) lines.push(`\n📱 投稿プラットフォーム: ${c.platform}`);
    if (c?.deadline) lines.push(`\n⏰ 締切: ${new Date(c.deadline).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}`);
    const budget = c?.budget_max || c?.budget_min;
    if (budget) lines.push(`\n💰 報酬: ¥${budget.toLocaleString()}`);
    lines.push("\n━━━━━━━━━━━━━━━━━━━━");
    lines.push("\n上記内容をご確認の上、ご不明な点がございましたらこちらのスレッドにてお気軽にご連絡ください。");
    return lines.join("\n");
  };

  const handleApprove = async (app: any) => {
    try {
      await invokeStatusUpdate(
        app, "approved",
        buildApprovalMessage(app),
        { title: "案件採用通知", message: `「${app.campaigns?.title || "案件"}」に採用されました！`, type: "success" }
      );
      toast.success("採用しました - メッセージスレッドを開きます");
      setThreadAppId(app.id);
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const handleReject = async (app: any) => {
    try {
      await invokeStatusUpdate(
        app, "rejected",
        `「${app.campaigns?.title || "案件"}」について、慎重に検討させていただきましたが、今回はご期待に沿えない結果となりました。またの機会にぜひご応募ください。`,
        { title: "選考結果のお知らせ", message: `「${app.campaigns?.title || "案件"}」の選考結果をお知らせします。`, type: "info" }
      );
      toast.success("不採用通知を送信しました");
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const getStatusBadge = (status: string) => {
    const s = APPLICATION_STATUSES.find(x => x.id === status);
    return <Badge className={s?.color || ""}>{s?.label || status}</Badge>;
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setCampaignFilter("all"); setCategoryFilter("all"); setDateFrom(""); setDateTo(""); };

  if (threadAppId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-120px)]">
        <ThreadConversation
          applicationId={threadAppId}
          userType="company"
          senderId={companyUserId}
          onBack={() => { setThreadAppId(null); queryClient.invalidateQueries({ queryKey: ["ext-applications"] }); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">応募者管理</h1>
        <p className="text-gray-500 mt-1">案件ごとに応募者を確認・選考・進行管理します。</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="IF名で検索..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">ステータス: すべて</option>
            {APPLICATION_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">案件: すべて</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="all">カテゴリ: すべて</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>応募日:</span>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
            <span>〜</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-1.5 rounded border border-gray-300 text-sm" />
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">クリア</Button>
        </div>
      </div>

      {/* Campaign-grouped applicants */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : groupedByCampaign.length === 0 ? (
        <div className="text-center py-12 text-gray-500">該当する応募はありません</div>
      ) : (
        <div className="space-y-4">
          {groupedByCampaign.map(group => {
            const cid = group.campaign.id;
            const isExpanded = expandedCampaigns.has(cid);
            const appliedCount = group.applications.filter(a => a.status === "applied" || a.status === "reviewing").length;
            const approvedCount = group.applications.filter(a => !["applied", "reviewing", "rejected"].includes(a.status)).length;

            return (
              <Card key={cid} className="border-0 shadow-sm overflow-hidden">
                {/* Campaign header */}
                <button
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => toggleCampaign(cid)}
                >
                  <div className="flex items-center gap-4">
                    {group.campaign.image_url && (
                      <img src={group.campaign.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{group.campaign.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {group.campaign.category && <Badge variant="outline" className="text-xs">{group.campaign.category}</Badge>}
                        {group.campaign.deadline && <span>締切: {new Date(group.campaign.deadline).toLocaleDateString("ja-JP")}</span>}
                        {(group.campaign.budget_max || group.campaign.budget_min) && (
                          <span>報酬: ¥{(group.campaign.budget_max || group.campaign.budget_min || 0).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{group.applications.length}名</span>
                      {appliedCount > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">{appliedCount}件 未選考</Badge>
                      )}
                      {approvedCount > 0 && (
                        <Badge className="bg-green-100 text-green-700 text-xs">{approvedCount}件 採用済</Badge>
                      )}
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {/* Applicant list */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {group.applications.map(app => {
                      const inf = app.influencer_profiles;
                      const isNew = app.status === "applied" || app.status === "reviewing";
                      const isRejected = app.status === "rejected";
                      const isActive = !isNew && !isRejected;

                      return (
                        <div key={app.id} className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors ${isRejected ? "opacity-50" : ""}`}>
                          <img
                            src={inf?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf?.name || "?")}`}
                            alt="" className="w-10 h-10 rounded-full bg-gray-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-gray-900 text-sm">{inf?.name || "-"}</span>
                              <span className="text-xs text-gray-400">@{inf?.username || "-"}</span>
                              {getStatusBadge(app.status)}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span>応募日: {new Date(app.applied_at).toLocaleDateString("ja-JP")}</span>
                              {inf?.instagram_followers ? <span className="text-pink-600">IG: {inf.instagram_followers.toLocaleString()}</span> : null}
                              {inf?.tiktok_followers ? <span>TT: {inf.tiktok_followers.toLocaleString()}</span> : null}
                              {inf?.youtube_followers ? <span className="text-red-600">YT: {inf.youtube_followers.toLocaleString()}</span> : null}
                            </div>
                            {app.motivation && <p className="text-xs text-gray-500 mt-1 truncate max-w-md italic">"{app.motivation}"</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isNew && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(app)} disabled={isUpdating}>
                                  <CheckCircle className="w-3 h-3 mr-1" />採用
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(app)} disabled={isUpdating}>
                                  <XCircle className="w-3 h-3 mr-1" />不採用
                                </Button>
                              </>
                            )}
                            {isActive && (
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setThreadAppId(app.id)}>
                                <MessageCircle className="w-3 h-3 mr-1" />スレッドを開く
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-600" onClick={async () => {
                              setSelectedApp(app);
                              setBankInfo(null);
                              if (inf?.user_id) {
                                const { data } = await supabase.from("bank_accounts").select("*").eq("user_id", inf.user_id).maybeSingle();
                                setBankInfo(data);
                              }
                            }}>
                              <Eye className="w-3 h-3 mr-1" />詳細
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">応募者詳細</h3>
              <button onClick={() => setSelectedApp(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedApp.influencer_profiles && (
                <div className="flex items-center gap-4">
                  <img src={selectedApp.influencer_profiles.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApp.influencer_profiles.name)}`} alt="" className="w-16 h-16 rounded-full" />
                  <div>
                    <p className="font-bold text-lg">{selectedApp.influencer_profiles.name}</p>
                    <p className="text-sm text-gray-500">@{selectedApp.influencer_profiles.username}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedApp.influencer_profiles.category || ""}</p>
                  </div>
                </div>
              )}
              {selectedApp.influencer_profiles?.bio && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedApp.influencer_profiles.bio}</p>}
              {selectedApp.influencer_profiles && (
                <div className="flex flex-wrap gap-2">
                  {selectedApp.influencer_profiles.instagram_url && (
                    <a href={selectedApp.influencer_profiles.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-xs hover:bg-pink-100 transition-colors">📷 Instagram</a>
                  )}
                  {selectedApp.influencer_profiles.tiktok_url && (
                    <a href={selectedApp.influencer_profiles.tiktok_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs hover:bg-gray-100 transition-colors">🎵 TikTok</a>
                  )}
                  {selectedApp.influencer_profiles.youtube_url && (
                    <a href={selectedApp.influencer_profiles.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100 transition-colors">▶️ YouTube</a>
                  )}
                  {selectedApp.influencer_profiles.twitter_url && (
                    <a href={selectedApp.influencer_profiles.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 transition-colors">𝕏 Twitter/X</a>
                  )}
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Instagram", val: selectedApp.influencer_profiles?.instagram_followers, color: "bg-pink-50", textColor: "text-pink-600" },
                  { label: "TikTok", val: selectedApp.influencer_profiles?.tiktok_followers, color: "bg-gray-50", textColor: "" },
                  { label: "YouTube", val: selectedApp.influencer_profiles?.youtube_followers, color: "bg-red-50", textColor: "text-red-600" },
                ].map(s => (
                  <div key={s.label} className={`text-center p-3 ${s.color} rounded-lg`}><p className={`text-xs ${s.textColor}`}>{s.label}</p><p className="font-bold">{(s.val || 0).toLocaleString()}</p></div>
                ))}
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">案件名</p>
                <p className="text-sm font-semibold">{selectedApp.campaigns?.title || "-"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">現在のステータス</p>
                {getStatusBadge(selectedApp.status)}
              </div>
              {selectedApp.motivation && (
                <div><p className="text-sm font-medium text-gray-700 mb-1">応募動機</p><p className="text-sm bg-gray-50 p-3 rounded-lg italic">"{selectedApp.motivation}"</p></div>
              )}
              {(selectedApp.status === "payment_pending" || selectedApp.status === "post_confirmed" || selectedApp.status === "approved" || selectedApp.status === "in_progress") && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><Wallet className="w-4 h-4" />振込先情報</p>
                  {bankInfo ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">銀行名:</span> <span className="font-medium">{bankInfo.bank_name}</span></div>
                      <div><span className="text-gray-500">支店名:</span> <span className="font-medium">{bankInfo.branch_name}</span></div>
                      <div><span className="text-gray-500">口座種別:</span> <span className="font-medium">{bankInfo.account_type === "ordinary" ? "普通" : "当座"}</span></div>
                      <div><span className="text-gray-500">口座番号:</span> <span className="font-medium">{bankInfo.account_number}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">口座名義:</span> <span className="font-medium">{bankInfo.account_holder}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">振込先情報が未登録です</p>
                  )}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end"><Button variant="outline" onClick={() => setSelectedApp(null)}>閉じる</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
