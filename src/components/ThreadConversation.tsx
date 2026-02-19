import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, FileText, Building2, Clock, ChevronDown, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

interface ThreadConversationProps {
  applicationId: string;
  userType: "company" | "influencer";
  senderId: string; // company user_id or influencer profile id
  onBack: () => void;
}

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

export default function ThreadConversation({ applicationId, userType, senderId, onBack }: ThreadConversationProps) {
  const [app, setApp] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThread = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-thread-messages", {
        body: { applicationId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setApp(data.application);
      setMessages(data.messages || []);
    } catch (e: any) {
      toast.error("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
    const interval = setInterval(fetchThread, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      const body: any = { applicationId, content: newMsg };
      if (userType === "influencer") body.senderProfileId = senderId;
      const { data, error } = await supabase.functions.invoke("send-thread-message", {
        body,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setNewMsg("");
      fetchThread();
    } catch (e: any) {
      toast.error(e.message || "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!app) return;
    const nextStatus = STATUS_FLOW[app.status];
    if (!nextStatus) return;
    const statusLabel = APPLICATION_STATUSES.find(s => s.id === nextStatus)?.label || nextStatus;
    setUpdatingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-status-notification", {
        body: {
          applicationId: app.id,
          newStatus: nextStatus,
          message: `ステータスが「${statusLabel}」に更新されました。`,
          notificationTitle: "ステータス更新",
          notificationMessage: `「${app.campaigns?.title || "案件"}」のステータスが「${statusLabel}」に更新されました。`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`「${statusLabel}」に更新しました`);
      fetchThread();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-500">読み込み中...</div>;
  if (!app) return <div className="text-center py-20 text-gray-500">データが見つかりません</div>;

  const campaign = app.campaigns;
  const influencer = app.influencer_profiles;
  const company = campaign?.companies;
  const isCompleted = app.status === "completed";
  const currentStatusObj = APPLICATION_STATUSES.find(s => s.id === app.status);
  const nextStatus = STATUS_FLOW[app.status];
  const nextLabel = nextStatus ? STATUS_ACTION_LABELS[app.status] : null;

  return (
    <div className="flex flex-col h-full min-h-[70vh]">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 truncate text-sm md:text-base">
              {userType === "company" ? influencer?.name : company?.name}
            </h2>
            <Badge className={currentStatusObj?.color || ""}>{currentStatusObj?.label || app.status}</Badge>
          </div>
          <p className="text-xs text-gray-500 truncate">案件: {campaign?.title}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCampaignDetail(!showCampaignDetail)} className="shrink-0 text-xs">
          <FileText className="w-3 h-3 mr-1" />案件詳細
        </Button>
      </div>

      {/* Campaign Detail Panel */}
      {showCampaignDetail && campaign && (
        <div className="bg-gray-50 border-b p-4 space-y-3 shrink-0 max-h-[40vh] overflow-y-auto">
          <div className="flex gap-4">
            {campaign.image_url && (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                <img src={campaign.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900">{campaign.title}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{company?.name}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-600">
                <span className="font-medium text-pink-600">¥{(campaign.budget_max || campaign.budget_min || 0).toLocaleString()}</span>
                {campaign.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />締切: {new Date(campaign.deadline).toLocaleDateString("ja-JP")}</span>}
                {campaign.platform && <Badge variant="outline" className="text-xs">{campaign.platform}</Badge>}
                {campaign.category && <Badge variant="outline" className="text-xs">{campaign.category}</Badge>}
              </div>
            </div>
          </div>
          {campaign.description && <p className="text-sm text-gray-700">{campaign.description}</p>}
          {campaign.deliverables && <div><p className="text-xs font-medium text-gray-500 mb-1">納品物</p><p className="text-sm text-gray-700">{campaign.deliverables}</p></div>}
          {campaign.requirements && <div><p className="text-xs font-medium text-gray-500 mb-1">条件</p><p className="text-sm text-gray-700">{campaign.requirements}</p></div>}

          {/* Status Progress */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">進捗状況</p>
            <div className="flex flex-wrap gap-1">
              {APPLICATION_STATUSES.filter(s => !["applied", "reviewing", "rejected"].includes(s.id)).map((s, i, arr) => (
                <div key={s.id} className="flex items-center gap-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    app.status === s.id ? s.color + " font-bold" :
                    APPLICATION_STATUSES.findIndex(x => x.id === app.status) >= APPLICATION_STATUSES.findIndex(x => x.id === s.id) ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>{s.label}</span>
                  {i < arr.length - 1 && <span className="text-gray-300 text-xs">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Company Status Action Bar */}
      {userType === "company" && nextLabel && !isCompleted && (
        <div className="bg-purple-50 border-b px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-sm text-purple-700">次のステップ:</span>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAdvanceStatus} disabled={updatingStatus}>
            <CheckCircle className="w-3 h-3 mr-1" />{nextLabel}
          </Button>
        </div>
      )}

      {isCompleted && (
        <div className="bg-gray-50 border-b px-4 py-2 text-center text-sm text-gray-500 shrink-0">
          ✅ この案件は完了しました。メッセージの送信はできません。
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">メッセージはまだありません</div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === senderId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMine
                    ? "bg-purple-600 text-white rounded-br-md"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-purple-200" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isCompleted && (
        <div className="bg-white border-t p-3 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="メッセージを入力..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Button size="sm" className="rounded-full bg-purple-600 hover:bg-purple-700 px-4" onClick={handleSend} disabled={sending || !newMsg.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
