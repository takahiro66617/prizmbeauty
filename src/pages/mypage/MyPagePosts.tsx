import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PenTool, Clock, CheckCircle, Send, FileText, ArrowRight, ExternalLink, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useExternalApplications } from "@/hooks/useExternalApplications";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: "投稿準備中", color: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "作業中", color: "bg-blue-100 text-blue-700" },
  post_submitted: { label: "投稿審査中", color: "bg-purple-100 text-purple-700" },
  post_confirmed: { label: "投稿承認済", color: "bg-green-100 text-green-700" },
  payment_pending: { label: "振込待ち", color: "bg-orange-100 text-orange-700" },
  completed: { label: "完了", color: "bg-gray-100 text-gray-700" },
};

export default function MyPagePosts() {
  const [userId, setUserId] = useState("");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [postUrl, setPostUrl] = useState("");
  const [postCaption, setPostCaption] = useState("");

  useEffect(() => {
    const u = sessionStorage.getItem("currentUser");
    if (u) setUserId(JSON.parse(u).id);
  }, []);

  const { data: applications = [], isLoading } = useExternalApplications({ influencerId: userId });

  // Only show applications that are approved or beyond (active workflow)
  const activeApps = applications.filter(a =>
    ["approved", "in_progress", "post_submitted", "post_confirmed", "payment_pending", "completed"].includes(a.status)
  );

  const waitingForPost = activeApps.filter(a => a.status === "approved" || a.status === "in_progress");
  const submitted = activeApps.filter(a => a.status === "post_submitted");
  const confirmed = activeApps.filter(a => ["post_confirmed", "payment_pending", "completed"].includes(a.status));

  const handleSubmitPost = async () => {
    if (!selectedApp || !postUrl) {
      toast.error("投稿URLを入力してください");
      return;
    }
    // Update application status to post_submitted
    const { error } = await supabase
      .from("applications")
      .update({ status: "post_submitted" })
      .eq("id", selectedApp.id);
    if (error) {
      toast.error("送信に失敗しました");
      return;
    }
    toast.success("投稿を報告しました！企業の確認をお待ちください。");
    setShowSubmitDialog(false);
    setPostUrl("");
    setPostCaption("");
    setSelectedApp(null);
    // Refresh
    window.location.reload();
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">読み込み中...</div>;

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <PenTool className="w-6 h-6 text-pink-500" /> 投稿管理
      </h1>

      {activeApps.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">投稿する案件はありません</h3>
          <p className="text-gray-500 mb-4">採用された案件がここに表示されます。</p>
          <Link to="/mypage/campaigns"><Button className="bg-pink-500 text-white hover:bg-pink-400">案件を探す</Button></Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Waiting for post submission */}
          {waitingForPost.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />投稿待ち ({waitingForPost.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {waitingForPost.map(app => (
                  <Card key={app.id} className="border-l-4 border-l-yellow-400 hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex gap-3 mb-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          {app.campaigns?.image_url ? <img src={app.campaigns.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><FileText className="w-6 h-6" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-2">{app.campaigns?.title || "不明な案件"}</h3>
                          <p className="text-xs text-gray-500 mt-1">{app.campaigns?.companies?.name || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={STATUS_LABELS[app.status]?.color}>{STATUS_LABELS[app.status]?.label}</Badge>
                        <Button size="sm" className="bg-pink-500 hover:bg-pink-400 text-white" onClick={() => {
                          setSelectedApp(app);
                          setShowSubmitDialog(true);
                        }}>
                          <Send className="w-3 h-3 mr-1" />投稿を報告
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Submitted, waiting for review */}
          {submitted.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />審査中 ({submitted.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {submitted.map(app => (
                  <Card key={app.id} className="border-l-4 border-l-purple-400">
                    <CardContent className="p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-2">{app.campaigns?.title || "不明"}</h3>
                      <p className="text-xs text-gray-500 mb-3">{app.campaigns?.companies?.name || ""}</p>
                      <Badge className={STATUS_LABELS[app.status]?.color}>{STATUS_LABELS[app.status]?.label}</Badge>
                      <p className="text-xs text-gray-500 mt-2">企業による確認をお待ちください。</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed / Completed */}
          {confirmed.length > 0 && (
            <div>
              <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />承認・完了 ({confirmed.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {confirmed.map(app => (
                  <Card key={app.id} className="border-l-4 border-l-green-400">
                    <CardContent className="p-5">
                      <h3 className="font-bold text-gray-900 text-sm mb-2">{app.campaigns?.title || "不明"}</h3>
                      <p className="text-xs text-gray-500 mb-3">{app.campaigns?.companies?.name || ""}</p>
                      <div className="flex items-center justify-between">
                        <Badge className={STATUS_LABELS[app.status]?.color}>{STATUS_LABELS[app.status]?.label}</Badge>
                        {app.campaigns?.budget_max && <span className="font-bold text-pink-500 text-sm">¥{app.campaigns.budget_max.toLocaleString()}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>投稿を報告する</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedApp && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-bold text-sm">{selectedApp.campaigns?.title}</p>
                <p className="text-xs text-gray-500">{selectedApp.campaigns?.companies?.name}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">投稿URL（必須）</label>
              <Input placeholder="https://instagram.com/p/..." value={postUrl} onChange={e => setPostUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">コメント（任意）</label>
              <Textarea placeholder="投稿についてのコメントがあれば記入してください" value={postCaption} onChange={e => setPostCaption(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>キャンセル</Button>
            <Button className="bg-pink-500 hover:bg-pink-400 text-white" onClick={handleSubmitPost}>報告する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
