import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Building2, Clock, CheckCircle, Image, X, Link as LinkIcon, Send, AlertTriangle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { toast } from "sonner";

interface ThreadConversationProps {
  applicationId: string;
  userType: "company" | "influencer" | "admin";
  senderId: string;
  onBack: () => void;
}

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

export default function ThreadConversation({ applicationId, userType, senderId, onBack }: ThreadConversationProps) {
  const [app, setApp] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showPostSubmit, setShowPostSubmit] = useState(false);
  const [postUrl, setPostUrl] = useState("");
  const [postCaption, setPostCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  // Admin/company message input
  const [msgText, setMsgText] = useState("");
  const [msgImages, setMsgImages] = useState<File[]>([]);
  const [msgImagePreviews, setMsgImagePreviews] = useState<string[]>([]);
  const [adminTarget, setAdminTarget] = useState<"company" | "influencer">("company");
  // Company revision request
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionText, setRevisionText] = useState("");
  const [revisionImages, setRevisionImages] = useState<File[]>([]);
  const [revisionImagePreviews, setRevisionImagePreviews] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const msgImageInputRef = useRef<HTMLInputElement>(null);
  const revisionImageInputRef = useRef<HTMLInputElement>(null);

  const fetchThread = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-thread-messages", {
        body: { applicationId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setApp(data.application);
      setMessages(data.messages || []);
    } catch {
      toast.error("読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
    const interval = setInterval(fetchThread, 10000);
    return () => clearInterval(interval);
  }, [applicationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${applicationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("thread-attachments").upload(path, file);
    if (error) { toast.error("画像アップロードに失敗しました"); return null; }
    const { data } = supabase.storage.from("thread-attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    return urls;
  };

  const handleSendMessage = async (content: string, imageUrl?: string, imageUrls?: string[], messageType?: string, visibility?: string, targetType?: string) => {
    setSending(true);
    try {
      const body: any = {
        applicationId, content,
        imageUrl: imageUrl || null,
        imageUrls: imageUrls || null,
        messageType: messageType || "text",
        visibility: visibility || "all",
        targetType: targetType || null,
      };
      if (userType === "influencer") body.senderProfileId = senderId;
      const { data, error } = await supabase.functions.invoke("send-thread-message", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      fetchThread();
    } catch (e: any) {
      toast.error(e.message || "送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleMultiImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    setPreviews: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (valid.length < files.length) toast.error("10MB以下の画像のみ選択できます");
    setFiles(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImage = (
    index: number,
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    setPreviews: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Post submit by influencer
  const handlePostSubmit = async () => {
    if (!postUrl.trim() && selectedImages.length === 0) {
      toast.error("投稿URLまたはスクリーンショットを入力してください");
      return;
    }
    setSending(true);
    try {
      const imageUrls = await uploadMultipleImages(selectedImages);
      const content = `📱 投稿報告\n\n${postUrl ? `投稿URL: ${postUrl}\n` : ""}${postCaption ? `説明: ${postCaption}` : ""}`;
      await handleSendMessage(content, imageUrls[0] || undefined, imageUrls.length > 1 ? imageUrls : undefined, "post_report", "all");
      
      // Auto-update status back to post_submitted when resubmitting after revision
      if (app?.status === "revision_requested") {
        try {
          await supabase.functions.invoke("send-status-notification", {
            body: {
              applicationId: app.id,
              newStatus: "post_submitted",
              message: "修正後の投稿報告が再提出されました。確認をお願いします。",
              notificationTitle: "再投稿報告",
              notificationMessage: `「${app.campaigns?.title || "案件"}」の修正後の投稿報告が届きました。`,
            },
          });
        } catch (e) {
          console.error("Failed to auto-update status:", e);
        }
      }
      
      setShowPostSubmit(false);
      setPostUrl("");
      setPostCaption("");
      setSelectedImages([]);
      setImagePreviews([]);
      toast.success("投稿報告を送信しました");
      fetchThread();
    } catch {
      toast.error("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  // Company revision request
  const handleRevisionRequest = async () => {
    if (!revisionText.trim() && revisionImages.length === 0) {
      toast.error("修正内容を入力してください");
      return;
    }
    setSending(true);
    try {
      const imageUrls = await uploadMultipleImages(revisionImages);
      const content = `🔄 修正依頼\n\n${revisionText}`;
      await handleSendMessage(content, imageUrls[0] || undefined, imageUrls.length > 1 ? imageUrls : undefined, "revision_request", "all");
      
      // Update status to revision_requested
      const statusLabel = APPLICATION_STATUSES.find(s => s.id === "revision_requested")?.label || "修正中";
      await supabase.functions.invoke("send-status-notification", {
        body: {
          applicationId: app.id, newStatus: "revision_requested",
          message: `ステータスが「${statusLabel}」に更新されました。`,
          notificationTitle: "修正依頼",
          notificationMessage: `「${app.campaigns?.title || "案件"}」について修正依頼が届きました。`,
        },
      });
      
      setShowRevisionForm(false);
      setRevisionText("");
      setRevisionImages([]);
      setRevisionImagePreviews([]);
      toast.success("修正依頼を送信しました");
      fetchThread();
    } catch {
      toast.error("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  // Admin/company/influencer direct message
  const handleSendDirectMessage = async () => {
    if (!msgText.trim() && msgImages.length === 0) return;
    setSending(true);
    try {
      const imageUrls = await uploadMultipleImages(msgImages);
      let visibility = "all";
      let targetType: string | undefined;
      
      if (userType === "admin") {
        targetType = adminTarget;
        visibility = adminTarget === "company" ? "admin_company" : "admin_influencer";
      } else if (userType === "company") {
        visibility = "admin_company";
      } else if (userType === "influencer") {
        visibility = "admin_influencer";
      }

      await handleSendMessage(msgText, imageUrls[0] || undefined, imageUrls.length > 1 ? imageUrls : undefined, "text", visibility, targetType);
      setMsgText("");
      setMsgImages([]);
      setMsgImagePreviews([]);
      toast.success("送信しました");
    } catch {
      toast.error("送信に失敗しました");
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
          applicationId: app.id, newStatus: nextStatus,
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

  // Filter messages by visibility
  const filterMessages = (msgs: any[]) => {
    if (userType === "admin") return msgs;
    if (userType === "company") return msgs.filter(m => m.visibility === "all" || m.visibility === "admin_company");
    if (userType === "influencer") return msgs.filter(m => m.visibility === "all" || m.visibility === "admin_influencer");
    return msgs;
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
  const canSubmitPost = userType === "influencer" && (app.status === "in_progress" || app.status === "revision_requested");
  const canRequestRevision = userType === "company" && app.status === "post_submitted";
  const canAdvance = (userType === "company" || userType === "admin") && nextLabel && !isCompleted;
  const canConfirmPayment = userType === "influencer" && app.status === "payment_pending";
  const filteredMessages = filterMessages(messages);

  const handleConfirmPayment = async () => {
    setUpdatingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-status-notification", {
        body: {
          applicationId: app.id,
          newStatus: "completed",
          message: "インフルエンサーが振込を確認しました。案件が完了しました。",
          notificationTitle: "振込確認・案件完了",
          notificationMessage: `「${app.campaigns?.title || "案件"}」のインフルエンサーが振込確認を行い、案件が完了しました。`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("振込確認が完了しました！");
      fetchThread();
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderImagePreviews = (previews: string[], onRemove: (i: number) => void) => (
    <div className="flex flex-wrap gap-2">
      {previews.map((src, i) => (
        <div key={i} className="relative inline-block">
          <img src={src} alt="" className="w-20 h-20 object-cover rounded-lg border" />
          <button onClick={() => onRemove(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
        </div>
      ))}
    </div>
  );

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
              {userType === "admin" ? `${influencer?.name} × ${company?.name}` : userType === "company" ? influencer?.name : company?.name}
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

      {/* Status Action Bar */}
      {canAdvance && app.status !== "post_submitted" && (
        <div className="bg-purple-50 border-b px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-sm text-purple-700">次のステップ:</span>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAdvanceStatus} disabled={updatingStatus}>
            <CheckCircle className="w-3 h-3 mr-1" />{nextLabel}
          </Button>
        </div>
      )}

      {/* Company: post_submitted - approve or request revision */}
      {(userType === "company" || userType === "admin") && app.status === "post_submitted" && !isCompleted && (
        <div className="bg-purple-50 border-b px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-sm text-purple-700">投稿を確認してください:</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => setShowRevisionForm(true)}>
              <AlertTriangle className="w-3 h-3 mr-1" />修正依頼
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAdvanceStatus} disabled={updatingStatus}>
              <CheckCircle className="w-3 h-3 mr-1" />投稿を承認
            </Button>
          </div>
        </div>
      )}

      {/* Influencer Post Submit Button */}
      {canSubmitPost && (
        <div className="bg-blue-50 border-b px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-sm text-blue-700">
            {app.status === "revision_requested" ? "修正内容を反映して再投稿してください" : "投稿が完了したら報告してください"}
          </span>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowPostSubmit(true)}>
            <FileText className="w-3 h-3 mr-1" />{app.status === "revision_requested" ? "再投稿報告" : "投稿報告"}
          </Button>
        </div>
      )}

      {canConfirmPayment && (
        <div className="bg-green-50 border-b px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-sm text-green-700">💰 振込が確認できましたら、下のボタンを押してください</span>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmPayment} disabled={updatingStatus}>
            <CheckCircle className="w-3 h-3 mr-1" />振込確認済み
          </Button>
        </div>
      )}

      {isCompleted && (
        <div className="bg-gray-50 border-b px-4 py-2 text-center text-sm text-gray-500 shrink-0">
          ✅ この案件は完了しました。
        </div>
      )}

      {/* Post Submit Form */}
      {showPostSubmit && (
        <div className="bg-blue-50 border-b p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-blue-900 text-sm">📱 投稿報告</h4>
            <button onClick={() => { setShowPostSubmit(false); setSelectedImages([]); setImagePreviews([]); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">投稿URL</label>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
                <input type="url" value={postUrl} onChange={e => setPostUrl(e.target.value)} placeholder="https://instagram.com/p/..."
                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">説明・コメント（任意）</label>
              <textarea value={postCaption} onChange={e => setPostCaption(e.target.value)} placeholder="投稿内容の説明やコメント..."
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">スクリーンショット（複数可）</label>
              {imagePreviews.length > 0 && renderImagePreviews(imagePreviews, (i) => removeImage(i, setSelectedImages, setImagePreviews))}
              <button onClick={() => postImageInputRef.current?.click()} className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-3 w-full text-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm">
                <Image className="w-5 h-5 mx-auto mb-1" />画像を追加
              </button>
              <input ref={postImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleMultiImageSelect(e, setSelectedImages, setImagePreviews)} />
            </div>
          </div>
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePostSubmit} disabled={sending}>
            {sending ? "送信中..." : "投稿報告を送信"}
          </Button>
        </div>
      )}

      {/* Revision Request Form */}
      {showRevisionForm && (
        <div className="bg-amber-50 border-b p-4 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-amber-900 text-sm">🔄 修正依頼</h4>
            <button onClick={() => { setShowRevisionForm(false); setRevisionImages([]); setRevisionImagePreviews([]); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">修正内容・指示</label>
              <textarea value={revisionText} onChange={e => setRevisionText(e.target.value)} placeholder="修正して欲しい箇所や内容を詳しく記載してください..."
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" rows={3} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">参考画像（複数可・任意）</label>
              {revisionImagePreviews.length > 0 && renderImagePreviews(revisionImagePreviews, (i) => removeImage(i, setRevisionImages, setRevisionImagePreviews))}
              <button onClick={() => revisionImageInputRef.current?.click()} className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-3 w-full text-center text-gray-400 hover:border-amber-400 hover:text-amber-500 transition-colors text-sm">
                <Image className="w-5 h-5 mx-auto mb-1" />画像を追加
              </button>
              <input ref={revisionImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleMultiImageSelect(e, setRevisionImages, setRevisionImagePreviews)} />
            </div>
          </div>
          <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={handleRevisionRequest} disabled={sending}>
            {sending ? "送信中..." : "修正依頼を送信"}
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">メッセージはまだありません</div>
        ) : (
          filteredMessages.map(msg => {
            const isMine = msg.sender_id === senderId;
            const isPostReport = msg.message_type === "post_report";
            const isBankInfo = msg.message_type === "bank_info";
            const isRevision = msg.message_type === "revision_request";
            const isPrivate = msg.visibility !== "all";

            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isBankInfo
                    ? "bg-green-50 border border-green-200 text-gray-900 rounded-bl-md"
                    : isRevision
                    ? "bg-amber-50 border border-amber-200 text-gray-900 rounded-bl-md"
                    : isPostReport
                    ? "bg-blue-100 border border-blue-200 text-gray-900 rounded-bl-md"
                    : isMine
                    ? "bg-purple-600 text-white rounded-br-md"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-md"
                }`}>
                  {isPrivate && userType === "admin" && (
                    <div className="flex items-center gap-1 mb-1">
                      <Eye className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400">
                        {msg.visibility === "admin_company" ? "企業のみ" : "IFのみ"}
                      </span>
                    </div>
                  )}
                  {isPostReport && (
                    <div className="flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-bold text-blue-600">投稿報告</span>
                    </div>
                  )}
                  {isRevision && (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span className="text-xs font-bold text-amber-600">修正依頼</span>
                    </div>
                  )}
                  {isBankInfo && (
                    <div className="flex items-center gap-1 mb-1">
                      <Building2 className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-bold text-green-600">振込先情報</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.image_url && (
                    <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                      <img src={msg.image_url} alt="添付画像" className="max-w-full max-h-60 rounded-lg border border-gray-200 cursor-pointer hover:opacity-90" />
                    </a>
                  )}
                  <p className={`text-[10px] mt-1 ${isBankInfo ? "text-green-400" : isRevision ? "text-amber-400" : isPostReport ? "text-blue-400" : isMine ? "text-purple-200" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Area */}
      {!isCompleted && (
        <div className="bg-white border-t px-4 py-3 shrink-0 space-y-2">
          {userType === "admin" && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">送信先:</span>
              <button onClick={() => setAdminTarget("company")} className={`text-xs px-3 py-1 rounded-full ${adminTarget === "company" ? "bg-blue-100 text-blue-700 font-medium" : "bg-gray-100 text-gray-500"}`}>
                企業
              </button>
              <button onClick={() => setAdminTarget("influencer")} className={`text-xs px-3 py-1 rounded-full ${adminTarget === "influencer" ? "bg-pink-100 text-pink-700 font-medium" : "bg-gray-100 text-gray-500"}`}>
                インフルエンサー
              </button>
            </div>
          )}
          {userType !== "admin" && (
            <p className="text-[10px] text-gray-400">
              💬 事務局宛のメッセージです。{userType === "company" ? "インフルエンサー" : "企業"}には表示されません。
            </p>
          )}
          {msgImagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {renderImagePreviews(msgImagePreviews, (i) => removeImage(i, setMsgImages, setMsgImagePreviews))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <button onClick={() => msgImageInputRef.current?.click()} className="text-gray-400 hover:text-gray-600 p-2">
              <Image className="w-5 h-5" />
            </button>
            <input ref={msgImageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleMultiImageSelect(e, setMsgImages, setMsgImagePreviews)} />
            <textarea value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="メッセージを入力..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" rows={1}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendDirectMessage(); } }} />
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSendDirectMessage} disabled={sending || (!msgText.trim() && msgImages.length === 0)}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
