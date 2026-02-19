import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, X, Search, MessageCircle, ArrowRight, Send, Wallet } from "lucide-react";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { useExternalCampaigns } from "@/hooks/useExternalCampaigns";
import { useQueryClient } from "@tanstack/react-query";
import { APPLICATION_STATUSES, CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ThreadConversation from "@/components/ThreadConversation";

const STATUS_FLOW: Record<string, string> = {
  approved: "in_progress",
  in_progress: "post_submitted",
  post_submitted: "post_confirmed",
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
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [msgModal, setMsgModal] = useState<any>(null);
  const [msgText, setMsgText] = useState("");
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [threadAppId, setThreadAppId] = useState<string | null>(null);
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

  const handleApprove = async (app: any) => {
    try {
      await invokeStatusUpdate(
        app, "approved",
        `🎉 おめでとうございます！「${app.campaigns?.title || "案件"}」に採用されました。詳細は追ってご連絡いたします。`,
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
        { title: "選考結果のお知らせ", message: `「${app.campaigns?.title || "案件"}」の選考結果をお知らせします。` }
      );
      toast.success("不採用にしました");
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const handleAdvanceStatus = async (app: any) => {
    const nextStatus = STATUS_FLOW[app.status];
    if (!nextStatus) return;
    const statusLabel = APPLICATION_STATUSES.find(s => s.id === nextStatus)?.label || nextStatus;
    try {
      await invokeStatusUpdate(
        app, nextStatus,
        `「${app.campaigns?.title || "案件"}」のステータスが「${statusLabel}」に更新されました。`,
      );
      toast.success(`ステータスを「${statusLabel}」に更新しました`);
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const handleSendDirectMessage = async () => {
    if (!msgText.trim() || !msgModal) return;
    const inf = msgModal.influencer_profiles;
    const receiverId = inf?.user_id || inf?.id;
    if (!receiverId) { toast.error("このインフルエンサーにはメッセージを送信できません"); return; }
    setIsUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const senderId = session?.user?.id;
      if (!senderId) { toast.error("ログインが必要です"); return; }
      await supabase.functions.invoke("send-status-notification", {
        body: {
          applicationId: msgModal.id,
          newStatus: msgModal.status, // keep same status
          message: msgText,
        },
      });
      toast.success("送信しました");
      setMsgText("");
      setMsgModal(null);
    } catch {
      toast.error("送信に失敗しました");
    } finally {
      setIsUpdating(false);
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
        <p className="text-gray-500 mt-1">案件への応募を確認・選考・進行管理します。</p>
      </div>

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

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const inf = app.influencer_profiles;
            const campaign = app.campaigns;
            const nextStatus = STATUS_FLOW[app.status];
            const nextLabel = nextStatus ? STATUS_ACTION_LABELS[app.status] : null;
            return (
              <Card key={app.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <img src={inf?.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf?.name || "?")}`} alt="" className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">{inf?.name || "-"}</h3>
                      <span className="text-sm text-gray-500">@{inf?.username || "-"}</span>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">案件: <span className="font-medium">{campaign?.title || "-"}</span></p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <span>応募日: {new Date(app.applied_at).toLocaleDateString("ja-JP")}</span>
                      {inf?.instagram_followers ? <span className="text-pink-600">IG: {inf.instagram_followers.toLocaleString()}</span> : null}
                      {inf?.tiktok_followers ? <span>TT: {inf.tiktok_followers.toLocaleString()}</span> : null}
                      {inf?.youtube_followers ? <span className="text-red-600">YT: {inf.youtube_followers.toLocaleString()}</span> : null}
                    </div>
                    {app.motivation && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg italic">"{app.motivation}"</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {(app.status === "applied" || app.status === "reviewing") && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(app)} disabled={isUpdating}>
                          <CheckCircle className="w-3 h-3 mr-1" />採用
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleReject(app)} disabled={isUpdating}>
                          <XCircle className="w-3 h-3 mr-1" />不採用
                        </Button>
                      </>
                    )}
                    {app.status !== "applied" && app.status !== "reviewing" && app.status !== "rejected" && (
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setThreadAppId(app.id)}>
                        <MessageCircle className="w-3 h-3 mr-1" />スレッドを開く
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-gray-500" onClick={async () => {
                      setSelectedApp(app);
                      setBankInfo(null);
                      if (app.influencer_profiles?.user_id) {
                        const { data } = await supabase.from("bank_accounts").select("*").eq("user_id", app.influencer_profiles.user_id).maybeSingle();
                        setBankInfo(data);
                      }
                    }}><Eye className="w-3 h-3 mr-1" />詳細</Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && <div className="text-center py-12 text-gray-500">該当する応募はありません</div>}
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
                <p className="text-sm font-medium text-gray-700 mb-1">現在のステータス</p>
                <div className="flex items-center gap-2">
                  {APPLICATION_STATUSES.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-1 rounded ${selectedApp.status === s.id ? s.color + " font-bold" : "text-gray-400"}`}>{s.label}</span>
                      {i < APPLICATION_STATUSES.length - 1 && <span className="text-gray-300">→</span>}
                    </div>
                  ))}
                </div>
              </div>
              {selectedApp.motivation && (
                <div><p className="text-sm font-medium text-gray-700 mb-1">応募動機</p><p className="text-sm bg-gray-50 p-3 rounded-lg italic">"{selectedApp.motivation}"</p></div>
              )}
              {/* Bank Info */}
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

      {/* Message Modal */}
      {msgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setMsgModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg">{msgModal.influencer_profiles?.name}にメッセージ</h3>
              <button onClick={() => setMsgModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">案件: {msgModal.campaigns?.title}</p>
              <textarea value={msgText} onChange={e => setMsgText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="メッセージを入力..." />
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setMsgModal(null)}>キャンセル</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSendDirectMessage} disabled={isUpdating}>
                <Send className="w-4 h-4 mr-2" />送信
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
